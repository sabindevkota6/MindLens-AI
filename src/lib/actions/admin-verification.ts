"use server";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

// s3 client used to generate presigned download urls for verification documents
const s3 = new S3Client({
  region: process.env.MY_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.MY_AWS_SESSION_TOKEN,
  },
});

const BUCKET = process.env.MY_AWS_BUCKET_NAME!;

// checks that the caller is an authenticated admin before allowing any action
async function assertAdmin(): Promise<
  { ok: true; session: Session } | { ok: false }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false };
  }
  return { ok: true, session };
}

// extracts the s3 object key from the stored public url
function keyFromDocumentUrl(documentUrl: string): string | null {
  try {
    const path = new URL(documentUrl).pathname;
    const key = path.startsWith("/") ? path.slice(1) : path;
    return key || null;
  } catch {
    return null;
  }
}

export type PendingCounselorListItem = {
  id: string;
  fullName: string;
  email: string;
  experienceYears: number;
  hourlyRate: number;
  professionalTitle: string | null;
  documentCount: number;
  lastUploadedAt: string | null;
  hasDocuments: boolean;
  specialties: { id: number; name: string }[];
};

// returns all counselors with pending verification status for the admin queue page
export async function listPendingCounselors(): Promise<
  PendingCounselorListItem[] | { error: string }
> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const rows = await prisma.counselorProfile.findMany({
    where: { verificationStatus: "PENDING" },
    // there is no updatedAt on CounselorProfile so we sort by id which is a cuid and roughly newest-first
    orderBy: { id: "desc" },
    include: {
      user: { select: { email: true } },
      documents: { select: { uploadedAt: true } },
      specialties: { include: { specialty: true } },
    },
  });

  return rows.map((p) => {
    const docs = p.documents;
    const last = docs.length
      ? docs.reduce((a, b) => (a.uploadedAt > b.uploadedAt ? a : b))
          .uploadedAt
      : null;
    return {
      id: p.id,
      fullName: p.fullName,
      email: p.user.email,
      experienceYears: p.experienceYears,
      hourlyRate: Number(p.hourlyRate),
      professionalTitle: p.professionalTitle,
      documentCount: docs.length,
      lastUploadedAt: last ? last.toISOString() : null,
      hasDocuments: docs.length > 0,
      specialties: p.specialties.map((s) => ({
        id: s.specialty.id,
        name: s.specialty.name,
      })),
    };
  });
}

export type CounselorVerificationDetail = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  bio: string | null;
  professionalTitle: string | null;
  experienceYears: number;
  hourlyRate: number;
  dateOfBirth: string | null;
  verificationStatus: string;
  documents: {
    id: string;
    documentUrl: string;
    uploadedAt: string;
  }[];
  specialties: { id: number; name: string }[];
};

// fetches the full detail of a single pending counselor for the verification review page
export async function getCounselorVerificationDetail(
  counselorProfileId: string
): Promise<CounselorVerificationDetail | null | { error: string }> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const p = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
    include: {
      user: { select: { email: true, phoneNumber: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
      specialties: { include: { specialty: true } },
    },
  });

  if (!p || p.verificationStatus !== "PENDING") return null;

  return {
    id: p.id,
    fullName: p.fullName,
    email: p.user.email,
    phoneNumber: p.user.phoneNumber,
    bio: p.bio,
    professionalTitle: p.professionalTitle,
    experienceYears: p.experienceYears,
    hourlyRate: Number(p.hourlyRate),
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString() : null,
    verificationStatus: p.verificationStatus,
    documents: p.documents.map((d) => ({
      id: d.id,
      documentUrl: d.documentUrl,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    specialties: p.specialties.map((s) => ({
      id: s.specialty.id,
      name: s.specialty.name,
    })),
  };
}

// generates a short-lived presigned url so the admin can download a verification document
export async function getAdminVerificationDocumentDownloadUrl(
  documentId: string
): Promise<{ url: string } | { error: string }> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const doc = await prisma.verificationDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) return { error: "Document not found" };

  const key = keyFromDocumentUrl(doc.documentUrl);
  if (!key) return { error: "Invalid file location" };

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: decodeURIComponent(key),
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return { url };
  } catch {
    return { error: "Could not create download link" };
  }
}

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// revalidates all counselor-facing and patient-facing paths after a verification status change
function revalidateCounselorSide() {
  revalidatePath("/dashboard/patient");
  revalidatePath("/dashboard/counselor");
  revalidatePath("/dashboard/counselor/profile");
  revalidatePath("/dashboard/counselor/onboarding");
}

// approves a pending counselor, sends a confirmation email, and creates an in-app notification
export async function approveCounselorVerification(
  counselorProfileId: string
): Promise<{ success: true } | { error: string }> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!profile || profile.verificationStatus !== "PENDING") {
    return { error: "Not found or not pending" };
  }

  await prisma.counselorProfile.update({
    where: { id: counselorProfileId },
    data: { verificationStatus: "VERIFIED" },
  });

  const base = appBaseUrl();
  const html = `
    <p>Hi ${profile.fullName},</p>
    <p>Your professional verification on MindLens AI is <strong>approved</strong>. Patients can now find you in the directory and book sessions.</p>
    <p><a href="${base}/dashboard/counselor">Open your dashboard</a></p>
  `;
  await sendEmail({
    to: profile.user.email,
    subject: "Your counselor verification was approved",
    html,
  });

  createNotification({
    userId: profile.user.id,
    type: "VERIFICATION_APPROVED",
    title: "Verification Approved",
    body: "Your professional verification has been approved. Patients can now find and book sessions with you.",
    data: { href: "/dashboard/counselor/profile" },
  }).catch(console.error);

  revalidateCounselorSide();
  revalidatePath("/dashboard/admin/verification");
  revalidatePath(`/dashboard/admin/verification/${counselorProfileId}`);

  return { success: true };
}

// rejects a pending counselor, sends an email asking them to re-upload documents
export async function rejectCounselorVerification(
  counselorProfileId: string
): Promise<{ success: true } | { error: string }> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!profile || profile.verificationStatus !== "PENDING") {
    return { error: "Not found or not pending" };
  }

  await prisma.counselorProfile.update({
    where: { id: counselorProfileId },
    data: { verificationStatus: "REJECTED" },
  });

  const base = appBaseUrl();
  const html = `
    <p>Hi ${profile.fullName},</p>
    <p>Your verification documents could not be approved. Please sign in and upload a valid professional license or certificate.</p>
    <p><a href="${base}/dashboard/counselor/profile">Go to profile</a> · <a href="${base}/dashboard/counselor/onboarding?step=3">Upload document</a></p>
  `;
  await sendEmail({
    to: profile.user.email,
    subject: "Verification update — action needed",
    html,
  });

  createNotification({
    userId: profile.user.id,
    type: "VERIFICATION_REJECTED",
    title: "Verification Rejected",
    body: "Your verification documents could not be approved. Please upload a valid professional license or certificate.",
    data: { href: "/dashboard/counselor/profile" },
  }).catch(console.error);

  revalidateCounselorSide();
  revalidatePath("/dashboard/admin/verification");
  revalidatePath(`/dashboard/admin/verification/${counselorProfileId}`);

  return { success: true };
}
