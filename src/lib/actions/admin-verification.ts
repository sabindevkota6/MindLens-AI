"use server";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

// shared s3 client for presigned reads (same config as verification uploads)
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME!;

// guard: only admin sessions can call these actions
async function assertAdmin(): Promise<
  { ok: true; session: Session } | { ok: false }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false };
  }
  return { ok: true, session };
}

// pull object key from our stored public url shape
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

// all counselors waiting on admin review (includes no document yet)
export async function listPendingCounselors(): Promise<
  PendingCounselorListItem[] | { error: string }
> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const rows = await prisma.counselorProfile.findMany({
    where: { verificationStatus: "PENDING" },
    // no updatedAt on CounselorProfile — id order is stable newest-first-ish for cuid
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

// one counselor for the detail page (must still be pending)
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

// presigned get url for admin only, short expiry
export async function getAdminVerificationDocumentDownloadUrl(
  documentId: string
): Promise<{ url: string } | { error: string }> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const doc = await prisma.verificationDocument.findUnique({
    where: { id: documentId },
    include: {
      counselor: { select: { verificationStatus: true } },
    },
  });

  if (!doc) return { error: "Document not found" };
  if (doc.counselor.verificationStatus !== "PENDING") {
    return { error: "Not available" };
  }

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

function revalidateCounselorSide() {
  revalidatePath("/dashboard/patient");
  revalidatePath("/dashboard/counselor");
  revalidatePath("/dashboard/counselor/profile");
  revalidatePath("/dashboard/counselor/onboarding");
}

export async function approveCounselorVerification(
  counselorProfileId: string
): Promise<{ success: true } | { error: string }> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
    include: { user: { select: { email: true } } },
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

  revalidateCounselorSide();
  revalidatePath("/dashboard/admin/verification");
  revalidatePath(`/dashboard/admin/verification/${counselorProfileId}`);

  return { success: true };
}

export async function rejectCounselorVerification(
  counselorProfileId: string
): Promise<{ success: true } | { error: string }> {
  const gate = await assertAdmin();
  if (!gate.ok) return { error: "Unauthorized" };

  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
    include: { user: { select: { email: true } } },
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

  revalidateCounselorSide();
  revalidatePath("/dashboard/admin/verification");
  revalidatePath(`/dashboard/admin/verification/${counselorProfileId}`);

  return { success: true };
}
