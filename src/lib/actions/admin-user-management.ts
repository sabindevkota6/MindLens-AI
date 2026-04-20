"use server";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { format } from "date-fns";
import {
  patientSuspendedEmail,
  patientBannedEmail,
  counselorSuspendedEmail,
  counselorBannedEmail,
  patientUnbannedEmail,
  counselorUnbannedEmail,
  patientUnsuspendedEmail,
  counselorUnsuspendedEmail,
} from "@/lib/email-templates";

// s3 client used to generate presigned download urls for counselor documents
const s3 = new S3Client({
  region: process.env.MY_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
    // session token is required for learner lab temporary credentials
    sessionToken: process.env.MY_AWS_SESSION_TOKEN,
  },
});

// s3 bucket name read from env so it can differ between environments
const BUCKET = process.env.MY_AWS_BUCKET_NAME!;

// checks that the caller is an authenticated admin before allowing any action
async function assertAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// extracts the s3 object key from a stored public url
function keyFromUrl(url: string): string | null {
  try {
    const p = new URL(url).pathname;
    const key = p.startsWith("/") ? p.slice(1) : p;
    return key || null;
  } catch {
    return null;
  }
}

// returns the base url of the app, falling back to localhost in development
function appBase() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// builds the correct dashboard url for a given role so reinstatement emails link to the right page
function dashboardUrlForRole(role: string): string {
  const base = appBase();
  if (role === "PATIENT") return `${base}/dashboard/patient`;
  if (role === "COUNSELOR") return `${base}/dashboard/counselor`;
  return `${base}/dashboard/admin`;
}

// revalidates all admin and dashboard paths that display user status so they reflect the change immediately
function revalidateUserPaths(userId: string) {
  revalidatePath("/dashboard/admin/users/counselors");
  revalidatePath("/dashboard/admin/users/patients");
  revalidatePath(`/dashboard/admin/users/counselors/${userId}`);
  revalidatePath(`/dashboard/admin/users/patients/${userId}`);
  revalidatePath("/dashboard/patient");
  revalidatePath("/dashboard/counselor");
}

// shape of the stats object shown at the top of the admin user management page
export type AdminUserStats = {
  totalPatients: number;
  totalCounselors: number;
  activeCounselors: number;
  pendingVerifications: number;
  suspendedUsers: number;
  bannedUsers: number;
  totalReportsThisWeek: number;
};

export async function getAdminUserStats(): Promise<AdminUserStats | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalPatients,
    totalCounselors,
    activeCounselors,
    pendingVerifications,
    suspendedUsers,
    bannedUsers,
    totalReportsThisWeek,
  ] = await Promise.all([
    prisma.patientProfile.count(),
    prisma.counselorProfile.count(),
    prisma.counselorProfile.count({
      where: { verificationStatus: "VERIFIED", user: { isBanned: false, isSuspended: false } },
    }),
    prisma.counselorProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.report.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  return {
    totalPatients,
    totalCounselors,
    activeCounselors,
    pendingVerifications,
    suspendedUsers,
    bannedUsers,
    totalReportsThisWeek,
  };
}

// search and filter params for the admin counselor list
export type AdminCounselorSearchParams = {
  query?: string;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED" | "all";
  accountStatus?: "active" | "suspended" | "banned" | "all";
  specialtyId?: number;
  sortBy?: "registeredAt" | "popularity" | "rating" | "experience";
  page?: number;
};

export type AdminCounselorListItem = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  image: string | null;
  professionalTitle: string | null;
  experienceYears: number;
  hourlyRate: number;
  verificationStatus: string;
  isSuspended: boolean;
  suspendedUntil: string | null;
  isBanned: boolean;
  avgRating: number;
  totalReviews: number;
  totalAppointments: number;
  oneStarCount: number;
  specialties: string[];
  registeredAt: string;
};

const ADMIN_PAGE_SIZE = 10;

export async function searchAdminCounselors(
  params: AdminCounselorSearchParams = {}
): Promise<
  | { counselors: AdminCounselorListItem[]; total: number; page: number; totalPages: number }
  | { error: string }
> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const page = params.page ?? 1;

  // build the where clause dynamically based on whichever filters the admin applied
  const where: Prisma.CounselorProfileWhereInput = {};

  if (params.query?.trim()) {
    const q = params.query.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { professionalTitle: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { specialties: { some: { specialty: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  if (params.verificationStatus && params.verificationStatus !== "all") {
    where.verificationStatus = params.verificationStatus;
  }

  if (params.specialtyId) {
    where.specialties = { some: { specialtyId: params.specialtyId } };
  }

  if (params.accountStatus && params.accountStatus !== "all") {
    if (params.accountStatus === "banned") {
      where.user = { isBanned: true };
    } else if (params.accountStatus === "suspended") {
      where.user = { isSuspended: true, isBanned: false };
    } else {
      where.user = { isBanned: false, isSuspended: false };
    }
  }

  // only db-level fields can be sorted by prisma directly; popularity and rating are sorted after fetching
  const orderBy: Prisma.CounselorProfileOrderByWithRelationInput =
    params.sortBy === "experience"
      ? { experienceYears: "desc" }
      : { user: { createdAt: "desc" } };

  const [rows, total] = await Promise.all([
    prisma.counselorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            image: true,
            isBanned: true,
            isSuspended: true,
            suspendedUntil: true,
            createdAt: true,
          },
        },
        specialties: { include: { specialty: true } },
        appointments: { select: { id: true } },
      },
      orderBy,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.counselorProfile.count({ where }),
  ]);

  // fetch rating stats for each counselor on this page in parallel to avoid sequential queries
  const ratingResults = await Promise.all(
    rows.map((r) =>
      Promise.all([
        prisma.review.aggregate({
          _avg: { rating: true },
          _count: { id: true },
          where: { appointment: { counselorProfileId: r.id } },
        }),
        prisma.review.count({
          where: { rating: 1, appointment: { counselorProfileId: r.id } },
        }),
      ])
    )
  );

  let counselors: AdminCounselorListItem[] = rows.map((r, i) => {
    const [stats, oneStarCount] = ratingResults[i];
    return {
      id: r.id,
      userId: r.user.id,
      fullName: r.fullName,
      email: r.user.email,
      image: r.user.image ?? null,
      professionalTitle: r.professionalTitle,
      experienceYears: r.experienceYears,
      hourlyRate: Number(r.hourlyRate),
      verificationStatus: r.verificationStatus,
      isSuspended: r.user.isSuspended,
      suspendedUntil: r.user.suspendedUntil ? r.user.suspendedUntil.toISOString() : null,
      isBanned: r.user.isBanned,
      avgRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
      totalReviews: stats._count.id,
      totalAppointments: r.appointments.length,
      oneStarCount,
      specialties: r.specialties.map((s) => s.specialty.name),
      registeredAt: r.user.createdAt.toISOString(),
    };
  });

  // apply in-memory sorts for fields that can not be sorted at the database level
  if (params.sortBy === "popularity") {
    counselors.sort((a, b) => b.totalAppointments - a.totalAppointments);
  } else if (params.sortBy === "rating") {
    counselors.sort((a, b) => b.avgRating - a.avgRating);
  }

  return { counselors, total, page, totalPages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

// search and filter params for the admin patient list
export type AdminPatientSearchParams = {
  query?: string;
  accountStatus?: "active" | "suspended" | "banned" | "all";
  reportedStatus?: "reported" | "unreported" | "all";
  sortBy?: "registeredAt" | "activeness" | "mostReported";
  page?: number;
};

export type AdminPatientListItem = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  image: string | null;
  bio: string | null;
  isSuspended: boolean;
  suspendedUntil: string | null;
  isBanned: boolean;
  totalAppointments: number;
  totalReports: number;
  registeredAt: string;
};

export async function searchAdminPatients(
  params: AdminPatientSearchParams = {}
): Promise<
  | { patients: AdminPatientListItem[]; total: number; page: number; totalPages: number }
  | { error: string }
> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const page = params.page ?? 1;

  const where: Prisma.PatientProfileWhereInput = {};

  if (params.query?.trim()) {
    const q = params.query.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { bio: { contains: q, mode: "insensitive" } },
    ];
  }

  if (params.accountStatus && params.accountStatus !== "all") {
    if (params.accountStatus === "banned") {
      where.user = { isBanned: true };
    } else if (params.accountStatus === "suspended") {
      where.user = { isSuspended: true, isBanned: false };
    } else {
      where.user = { isBanned: false, isSuspended: false };
    }
  }

  if (params.reportedStatus === "reported") {
    where.reports = { some: {} };
  } else if (params.reportedStatus === "unreported") {
    where.reports = { none: {} };
  }

  const orderBy: Prisma.PatientProfileOrderByWithRelationInput =
    params.sortBy === "registeredAt" ? { user: { createdAt: "desc" } } : { id: "desc" };

  const [rows, total] = await Promise.all([
    prisma.patientProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            image: true,
            isBanned: true,
            isSuspended: true,
            suspendedUntil: true,
            createdAt: true,
          },
        },
        appointments: { select: { id: true } },
        reports: { select: { id: true } },
      },
      orderBy,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.patientProfile.count({ where }),
  ]);

  let patients: AdminPatientListItem[] = rows.map((r) => ({
    id: r.id,
    userId: r.user.id,
    fullName: r.fullName,
    email: r.user.email,
    image: r.user.image ?? null,
    bio: r.bio,
    isSuspended: r.user.isSuspended,
    suspendedUntil: r.user.suspendedUntil ? r.user.suspendedUntil.toISOString() : null,
    isBanned: r.user.isBanned,
    totalAppointments: r.appointments.length,
    totalReports: r.reports.length,
    registeredAt: r.user.createdAt.toISOString(),
  }));

  if (params.sortBy === "activeness") patients.sort((a, b) => b.totalAppointments - a.totalAppointments);
  else if (params.sortBy === "mostReported") patients.sort((a, b) => b.totalReports - a.totalReports);

  return { patients, total, page, totalPages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

// full detail shape for a single counselor shown on the admin user detail page
export type AdminCounselorDetail = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  image: string | null;
  phoneNumber: string | null;
  bio: string | null;
  professionalTitle: string | null;
  experienceYears: number;
  hourlyRate: number;
  verificationStatus: string;
  isSuspended: boolean;
  suspendedUntil: string | null;
  suspendReason: string | null;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  registeredAt: string;
  avgRating: number;
  totalReviews: number;
  oneStarCount: number;
  totalAppointments: number;
  completedAppointments: number;
  missedAppointments: number;
  cancelledAppointments: number;
  specialties: { id: number; name: string }[];
  documents: { id: string; documentUrl: string; uploadedAt: string }[];
  recentReviews: { id: string; rating: number; comment: string | null; createdAt: string }[];
  recentAuditLog: { action: string; reason: string | null; createdAt: string; adminName: string }[];
};

export async function getAdminCounselorDetail(
  counselorProfileId: string
): Promise<AdminCounselorDetail | null | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          image: true,
          phoneNumber: true,
          isBanned: true,
          isSuspended: true,
          suspendedUntil: true,
          suspendReason: true,
          bannedAt: true,
          banReason: true,
          createdAt: true,
          adminActionsReceived: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              admin: { select: { adminProfile: { select: { fullName: true } } } },
            },
          },
        },
      },
      specialties: { include: { specialty: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!profile) return null;

  const [ratingStats, oneStarCount, appointmentStats, recentReviews] = await Promise.all([
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { id: true },
      where: { appointment: { counselorProfileId } },
    }),
    prisma.review.count({
      where: { rating: 1, appointment: { counselorProfileId } },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { counselorProfileId },
      _count: { id: true },
    }),
    prisma.review.findMany({
      where: { appointment: { counselorProfileId } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const statusCounts = Object.fromEntries(
    appointmentStats.map((s) => [s.status, s._count.id])
  );

  return {
    id: profile.id,
    userId: profile.user.id,
    fullName: profile.fullName,
    email: profile.user.email,
    image: profile.user.image ?? null,
    phoneNumber: profile.user.phoneNumber,
    bio: profile.bio,
    professionalTitle: profile.professionalTitle,
    experienceYears: profile.experienceYears,
    hourlyRate: Number(profile.hourlyRate),
    verificationStatus: profile.verificationStatus,
    isSuspended: profile.user.isSuspended,
    suspendedUntil: profile.user.suspendedUntil?.toISOString() ?? null,
    suspendReason: profile.user.suspendReason,
    isBanned: profile.user.isBanned,
    bannedAt: profile.user.bannedAt?.toISOString() ?? null,
    banReason: profile.user.banReason,
    registeredAt: profile.user.createdAt.toISOString(),
    avgRating: ratingStats._avg.rating ? Math.round(ratingStats._avg.rating * 10) / 10 : 0,
    totalReviews: ratingStats._count.id,
    oneStarCount,
    totalAppointments: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    completedAppointments: statusCounts["COMPLETED"] ?? 0,
    missedAppointments: statusCounts["MISSED"] ?? 0,
    cancelledAppointments: statusCounts["CANCELLED"] ?? 0,
    specialties: profile.specialties.map((s) => ({ id: s.specialty.id, name: s.specialty.name })),
    documents: profile.documents.map((d) => ({
      id: d.id,
      documentUrl: d.documentUrl,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    recentReviews: recentReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
    recentAuditLog: profile.user.adminActionsReceived.map((log) => ({
      action: log.action,
      reason: log.reason,
      createdAt: log.createdAt.toISOString(),
      adminName: log.admin?.adminProfile?.fullName ?? "System",
    })),
  };
}

// full detail shape for a single patient shown on the admin user detail page
export type AdminPatientDetail = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  image: string | null;
  phoneNumber: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  isSuspended: boolean;
  suspendedUntil: string | null;
  suspendReason: string | null;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  registeredAt: string;
  totalAppointments: number;
  completedAppointments: number;
  missedAppointments: number;
  cancelledAppointments: number;
  totalReports: number;
  reports: { id: string; reason: string; counselorName: string; createdAt: string }[];
  recentAuditLog: { action: string; reason: string | null; createdAt: string; adminName: string }[];
};

export async function getAdminPatientDetail(
  patientProfileId: string
): Promise<AdminPatientDetail | null | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const profile = await prisma.patientProfile.findUnique({
    where: { id: patientProfileId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          image: true,
          phoneNumber: true,
          isBanned: true,
          isSuspended: true,
          suspendedUntil: true,
          suspendReason: true,
          bannedAt: true,
          banReason: true,
          createdAt: true,
          adminActionsReceived: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              admin: { select: { adminProfile: { select: { fullName: true } } } },
            },
          },
        },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        include: { counselor: { select: { fullName: true } } },
      },
    },
  });

  if (!profile) return null;

  const appointmentStats = await prisma.appointment.groupBy({
    by: ["status"],
    where: { patientProfileId },
    _count: { id: true },
  });

  const statusCounts = Object.fromEntries(
    appointmentStats.map((s) => [s.status, s._count.id])
  );

  return {
    id: profile.id,
    userId: profile.user.id,
    fullName: profile.fullName,
    email: profile.user.email,
    image: profile.user.image ?? null,
    phoneNumber: profile.user.phoneNumber,
    bio: profile.bio,
    dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
    isSuspended: profile.user.isSuspended,
    suspendedUntil: profile.user.suspendedUntil?.toISOString() ?? null,
    suspendReason: profile.user.suspendReason,
    isBanned: profile.user.isBanned,
    bannedAt: profile.user.bannedAt?.toISOString() ?? null,
    banReason: profile.user.banReason,
    registeredAt: profile.user.createdAt.toISOString(),
    totalAppointments: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    completedAppointments: statusCounts["COMPLETED"] ?? 0,
    missedAppointments: statusCounts["MISSED"] ?? 0,
    cancelledAppointments: statusCounts["CANCELLED"] ?? 0,
    totalReports: profile.reports.length,
    reports: profile.reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      counselorName: r.counselor.fullName,
      createdAt: r.createdAt.toISOString(),
    })),
    recentAuditLog: profile.user.adminActionsReceived.map((log) => ({
      action: log.action,
      reason: log.reason,
      createdAt: log.createdAt.toISOString(),
      adminName: log.admin?.adminProfile?.fullName ?? "System",
    })),
  };
}

// permanently bans a user, writes to the audit log, and sends a ban notification email
export async function adminBanUser(
  targetUserId: string,
  reason: string
): Promise<{ success: true } | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };
  if (!reason.trim()) return { error: "A reason is required to ban a user" };

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      patientProfile: { select: { fullName: true } },
      counselorProfile: { select: { fullName: true } },
    },
  });

  if (!user) return { error: "User not found" };
  if (user.isBanned) return { error: "User is already banned" };

  const name = user.patientProfile?.fullName ?? user.counselorProfile?.fullName ?? "User";

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isBanned: true,
      isSuspended: false,
      suspendedUntil: null,
      bannedAt: new Date(),
      banReason: reason.trim(),
    },
  });

  await prisma.adminActionLog.create({
    data: {
      adminUserId: session.user.id,
      targetUserId,
      action: "BAN",
      reason: reason.trim(),
      metadata: { manual: true },
    },
  });

  const emailHtml =
    user.role === "PATIENT"
      ? patientBannedEmail({ patientName: name, reason: reason.trim() })
      : counselorBannedEmail({ counselorName: name, reason: reason.trim() });

  sendEmail({
    to: user.email,
    subject: "Your MindLens AI account has been banned",
    html: emailHtml,
  }).catch(console.error);

  createNotification({
    userId: targetUserId,
    type: "ACCOUNT_BANNED",
    title: "Account Banned",
    body: `Your account has been banned. Reason: ${reason.trim()}`,
  }).catch(console.error);

  revalidateUserPaths(targetUserId);
  return { success: true };
}

// lifts a ban from a user, writes to the audit log, and sends a reinstatement email
export async function adminUnbanUser(
  targetUserId: string
): Promise<{ success: true } | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      patientProfile: { select: { fullName: true } },
      counselorProfile: { select: { fullName: true } },
    },
  });
  if (!user) return { error: "User not found" };
  if (!user.isBanned) return { error: "User is not currently banned" };

  await prisma.user.update({
    where: { id: targetUserId },
    data: { isBanned: false, bannedAt: null, banReason: null },
  });

  await prisma.adminActionLog.create({
    data: {
      adminUserId: session.user.id,
      targetUserId,
      action: "UNBAN",
      metadata: { manual: true },
    },
  });

  const name = user.patientProfile?.fullName ?? user.counselorProfile?.fullName ?? "User";
  const dashboardUrl = dashboardUrlForRole(user.role);
  const emailHtml =
    user.role === "PATIENT"
      ? patientUnbannedEmail({ patientName: name, dashboardUrl })
      : counselorUnbannedEmail({ counselorName: name, dashboardUrl });

  sendEmail({
    to: user.email,
    subject: "Your MindLens AI account has been reinstated",
    html: emailHtml,
  }).catch(console.error);

  createNotification({
    userId: targetUserId,
    type: "ACCOUNT_UNBANNED",
    title: "Account Reinstated",
    body: "Your account ban has been lifted. You can now access MindLens AI.",
  }).catch(console.error);

  revalidateUserPaths(targetUserId);
  return { success: true };
}

// suspends a user for a set number of days, writes to the audit log, and sends a suspension email
export async function adminSuspendUser(
  targetUserId: string,
  days: number,
  reason: string
): Promise<{ success: true } | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };
  if (!reason.trim()) return { error: "A reason is required to suspend a user" };
  if (days < 1 || days > 365) return { error: "Suspension must be between 1 and 365 days" };

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      patientProfile: { select: { fullName: true } },
      counselorProfile: { select: { fullName: true } },
    },
  });

  if (!user) return { error: "User not found" };
  if (user.isBanned) return { error: "Cannot suspend a banned user" };

  const until = new Date();
  until.setDate(until.getDate() + days);

  const name = user.patientProfile?.fullName ?? user.counselorProfile?.fullName ?? "User";

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isSuspended: true,
      suspendedUntil: until,
      suspendedAt: new Date(),
      suspendReason: reason.trim(),
    },
  });

  await prisma.adminActionLog.create({
    data: {
      adminUserId: session.user.id,
      targetUserId,
      action: "SUSPEND",
      reason: reason.trim(),
      metadata: { days, manual: true },
    },
  });

  const untilStr = format(until, "MMMM d, yyyy");

  const emailHtml =
    user.role === "PATIENT"
      ? patientSuspendedEmail({ patientName: name, days, suspendedUntil: untilStr, reason: reason.trim() })
      : counselorSuspendedEmail({ counselorName: name, days, suspendedUntil: untilStr, reason: reason.trim() });

  sendEmail({
    to: user.email,
    subject: "Your MindLens AI account has been suspended",
    html: emailHtml,
  }).catch(console.error);

  createNotification({
    userId: targetUserId,
    type: "ACCOUNT_SUSPENDED",
    title: "Account Suspended",
    body: `Your account has been suspended until ${untilStr}. Reason: ${reason.trim()}`,
  }).catch(console.error);

  revalidateUserPaths(targetUserId);
  return { success: true };
}

// manually lifts a suspension from a user and sends a reinstatement email
export async function adminUnsuspendUser(
  targetUserId: string
): Promise<{ success: true } | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      patientProfile: { select: { fullName: true } },
      counselorProfile: { select: { fullName: true } },
    },
  });
  if (!user) return { error: "User not found" };
  if (!user.isSuspended) return { error: "User is not currently suspended" };

  await prisma.user.update({
    where: { id: targetUserId },
    data: { isSuspended: false, suspendedUntil: null, suspendedAt: null, suspendReason: null },
  });

  await prisma.adminActionLog.create({
    data: {
      adminUserId: session.user.id,
      targetUserId,
      action: "UNSUSPEND",
      metadata: { manual: true },
    },
  });

  const name = user.patientProfile?.fullName ?? user.counselorProfile?.fullName ?? "User";
  const dashboardUrl = dashboardUrlForRole(user.role);
  const emailHtml =
    user.role === "PATIENT"
      ? patientUnsuspendedEmail({ patientName: name, dashboardUrl, automatic: false })
      : counselorUnsuspendedEmail({ counselorName: name, dashboardUrl, automatic: false });

  sendEmail({
    to: user.email,
    subject: "Your MindLens AI suspension has been lifted",
    html: emailHtml,
  }).catch(console.error);

  createNotification({
    userId: targetUserId,
    type: "ACCOUNT_UNSUSPENDED",
    title: "Suspension Lifted",
    body: "Your account suspension has been lifted. Welcome back to MindLens AI.",
  }).catch(console.error);

  revalidateUserPaths(targetUserId);
  return { success: true };
}

// verifies a counselor directly from the user management detail page and notifies them
export async function adminVerifyCounselor(
  counselorProfileId: string
): Promise<{ success: true } | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!profile) return { error: "Counselor not found" };
  if (profile.verificationStatus === "VERIFIED") return { error: "Already verified" };

  await prisma.counselorProfile.update({
    where: { id: counselorProfileId },
    data: { verificationStatus: "VERIFIED" },
  });

  await prisma.adminActionLog.create({
    data: {
      adminUserId: session.user.id,
      targetUserId: profile.user.id,
      action: "VERIFY_COUNSELOR",
      metadata: { from: profile.verificationStatus },
    },
  });

  const base = appBase();
  sendEmail({
    to: profile.user.email,
    subject: "Your counselor verification was approved",
    html: `
      <p>Hi ${profile.fullName},</p>
      <p>Your professional verification on MindLens AI is <strong>approved</strong>. Patients can now find you in the directory and book sessions.</p>
      <p><a href="${base}/dashboard/counselor">Open your dashboard</a></p>
    `.trim(),
  }).catch(console.error);

  createNotification({
    userId: profile.user.id,
    type: "VERIFICATION_APPROVED",
    title: "Verification Approved",
    body: "Your professional verification has been approved. Patients can now find and book sessions with you.",
    data: { href: "/dashboard/counselor/profile" },
  }).catch(console.error);

  revalidatePath("/dashboard/admin/users/counselors");
  revalidatePath(`/dashboard/admin/users/counselors/${counselorProfileId}`);
  revalidatePath("/dashboard/admin/verification");
  revalidatePath("/dashboard/patient");
  revalidatePath("/dashboard/counselor");
  return { success: true };
}

// revokes a counselor's verification and emails them to re-upload documents
export async function adminRevokeCounselorVerification(
  counselorProfileId: string
): Promise<{ success: true } | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!profile) return { error: "Counselor not found" };
  if (profile.verificationStatus !== "VERIFIED") return { error: "Counselor is not currently verified" };

  await prisma.counselorProfile.update({
    where: { id: counselorProfileId },
    data: { verificationStatus: "PENDING" },
  });

  await prisma.adminActionLog.create({
    data: {
      adminUserId: session.user.id,
      targetUserId: profile.user.id,
      action: "REVOKE_VERIFICATION",
    },
  });

  const base = appBase();
  sendEmail({
    to: profile.user.email,
    subject: "Your counselor verification has been revoked",
    html: `
      <p>Hi ${profile.fullName},</p>
      <p>Your professional verification on MindLens AI has been revoked by an administrator. Please re-upload your documents for re-review.</p>
      <p><a href="${base}/dashboard/counselor/onboarding?step=3">Upload document</a></p>
    `.trim(),
  }).catch(console.error);

  createNotification({
    userId: profile.user.id,
    type: "VERIFICATION_REVOKED",
    title: "Verification Revoked",
    body: "Your professional verification has been revoked. Please re-upload your documents for re-review.",
    data: { href: "/dashboard/counselor/profile" },
  }).catch(console.error);

  revalidatePath("/dashboard/admin/users/counselors");
  revalidatePath(`/dashboard/admin/users/counselors/${counselorProfileId}`);
  revalidatePath("/dashboard/patient");
  revalidatePath("/dashboard/counselor");
  return { success: true };
}

// generates a short-lived presigned url so admin can download any counselor verification document
export async function getAdminDocumentDownloadUrl(
  documentId: string
): Promise<{ url: string } | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const doc = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
  if (!doc) return { error: "Document not found" };

  const key = keyFromUrl(doc.documentUrl);
  if (!key) return { error: "Invalid file location" };

  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: decodeURIComponent(key) });
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return { url };
  } catch {
    return { error: "Could not create download link" };
  }
}
