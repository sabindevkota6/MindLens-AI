"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// guard: only admin can call this
async function assertAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export type AdminStats = {
  // platform user counts
  totalUsers: number;
  newUsersThisMonth: number;
  totalPatients: number;
  totalCounselors: number;
  verifiedCounselors: number;
  activeCounselors: number;
  pendingCounselors: number;
  rejectedCounselors: number;
  suspendedUsers: number;
  bannedUsers: number;

  // appointment stats
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  missedAppointments: number;

  // financial + quality
  platformRevenue: number;
  avgPlatformRating: number;
  totalReviews: number;
  totalEmotionLogs: number;
  totalReportsThisWeek: number;

  // chart data
  monthlyUserRegistrations: { month: string; patients: number; counselors: number }[];
  counselorVerificationBreakdown: { status: string; count: number; fill: string }[];
  monthlyAppointmentTrends: {
    month: string;
    completed: number;
    cancelled: number;
    missed: number;
    scheduled: number;
  }[];
  appointmentStatusDistribution: { name: string; value: number; fill: string }[];
  topSpecialties: { name: string; count: number }[];
  dominantEmotions: { emotion: string; count: number }[];

  // list data
  topCounselors: {
    id: string;
    fullName: string;
    professionalTitle: string | null;
    avgRating: number;
    totalAppointments: number;
    primarySpecialty: string | null;
  }[];
  recentReports: {
    id: string;
    reason: string;
    patientName: string;
    counselorName: string;
    createdAt: string;
  }[];

  // this week snapshot
  newUsersThisWeek: number;
  newAppointmentsThisWeek: number;
  pendingVerificationsCount: number;
};

// get all platform-wide stats for the admin analytics page
export async function getAdminStats(): Promise<AdminStats | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  // compute date boundaries before the parallel queries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // run all queries in parallel for performance
  const [
    usersByRole,
    newUsersThisMonth,
    counselorVerificationGroups,
    activeCounselors,
    suspendedUsers,
    bannedUsers,
    reportsThisWeek,
    appointmentsByStatus,
    revenueResult,
    reviewStats,
    totalEmotionLogs,
    monthlyUserRegs,
    monthlyApptTrends,
    topSpecialtiesRaw,
    dominantEmotionsRaw,
    topCounselorsRaw,
    recentReports,
    newUsersThisWeek,
    newAppointmentsThisWeek,
  ] = await Promise.all([
    // total users broken down by role
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),

    // new signups this calendar month
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),

    // counselor verification status breakdown
    prisma.counselorProfile.groupBy({ by: ["verificationStatus"], _count: { id: true } }),

    // active counselors: verified + not suspended or banned
    prisma.counselorProfile.count({
      where: {
        verificationStatus: "VERIFIED",
        user: { isBanned: false, isSuspended: false },
      },
    }),

    // total suspended user accounts
    prisma.user.count({ where: { isSuspended: true } }),

    // total permanently banned user accounts
    prisma.user.count({ where: { isBanned: true } }),

    // reports filed in the last 7 days
    prisma.report.count({ where: { createdAt: { gte: weekAgo } } }),

    // appointment counts grouped by status
    prisma.appointment.groupBy({ by: ["status"], _count: { id: true } }),

    // platform revenue: sum of hourly rates for all completed appointments
    prisma.$queryRaw<[{ revenue: unknown }]>`
      SELECT COALESCE(SUM(cp."hourlyRate"), 0) AS revenue
      FROM "Appointment" a
      JOIN "CounselorProfile" cp ON a."counselorProfileId" = cp."id"
      WHERE a."status" = 'COMPLETED'
    `,

    // average rating and total review count across the whole platform
    prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),

    // total emotion analysis sessions logged
    prisma.emotionLog.count(),

    // monthly new user registrations split by role (last 6 months)
    prisma.$queryRaw<{ month: string; role: string; count: bigint }[]>`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') AS month,
        role,
        COUNT(*) AS count
      FROM "User"
      WHERE role IN ('PATIENT', 'COUNSELOR')
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM'), role
      ORDER BY month ASC
    `,

    // monthly appointment outcomes for the last 6 months
    prisma.$queryRaw<{
      month: string;
      completed: bigint;
      cancelled: bigint;
      missed: bigint;
      scheduled: bigint;
    }[]>`
      SELECT
        TO_CHAR(s."startTime", 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE a."status" = 'COMPLETED') AS completed,
        COUNT(*) FILTER (WHERE a."status" = 'CANCELLED') AS cancelled,
        COUNT(*) FILTER (WHERE a."status" = 'MISSED') AS missed,
        COUNT(*) FILTER (WHERE a."status" = 'SCHEDULED') AS scheduled
      FROM "Appointment" a
      JOIN "AvailabilitySlot" s ON a."slotId" = s."id"
      WHERE s."startTime" >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(s."startTime", 'YYYY-MM')
      ORDER BY month ASC
    `,

    // top 8 specialties by number of counselors who have them
    prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT st."name", COUNT(*) AS count
      FROM "CounselorSpecialty" cs
      JOIN "SpecialtyType" st ON cs."specialtyId" = st."id"
      GROUP BY st."name"
      ORDER BY count DESC
      LIMIT 8
    `,

    // top 8 dominant emotions recorded across all emotion logs
    prisma.emotionLog.groupBy({
      by: ["dominantEmotion"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),

    // top 5 verified counselors ranked by average rating
    prisma.$queryRaw<{
      id: string;
      fullName: string;
      professionalTitle: string | null;
      avgRating: unknown;
      totalAppointments: bigint;
    }[]>`
      SELECT
        cp."id",
        cp."fullName",
        cp."professionalTitle",
        ROUND(AVG(r."rating")::numeric, 1) AS "avgRating",
        COUNT(DISTINCT a."id") AS "totalAppointments"
      FROM "CounselorProfile" cp
      LEFT JOIN "Appointment" a ON a."counselorProfileId" = cp."id"
      LEFT JOIN "Review" r ON r."appointmentId" = a."id"
      WHERE cp."verificationStatus" = 'VERIFIED'
      GROUP BY cp."id", cp."fullName", cp."professionalTitle"
      HAVING COUNT(r."id") > 0
      ORDER BY "avgRating" DESC, "totalAppointments" DESC
      LIMIT 5
    `,

    // last 5 abuse/issue reports with patient and counselor names
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        patient: { select: { fullName: true } },
        counselor: { select: { fullName: true } },
      },
    }),

    // new user signups since the start of the current week (monday)
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),

    // new appointments booked since the start of the current week
    prisma.appointment.count({ where: { createdAt: { gte: startOfWeek } } }),
  ]);

  // get the primary specialty for each top counselor (one extra small query)
  const topCounselorIds = topCounselorsRaw.map((c) => c.id);
  const specialtyMap: Record<string, string> = {};
  if (topCounselorIds.length > 0) {
    const specialties = await prisma.counselorSpecialty.findMany({
      where: { counselorProfileId: { in: topCounselorIds } },
      include: { specialty: { select: { name: true } } },
    });
    // keep only the first specialty per counselor
    for (const s of specialties) {
      if (!specialtyMap[s.counselorProfileId]) {
        specialtyMap[s.counselorProfileId] = s.specialty.name;
      }
    }
  }

  // build user role counts map
  const roleMap: Record<string, number> = { PATIENT: 0, COUNSELOR: 0, ADMIN: 0 };
  for (const entry of usersByRole) {
    roleMap[entry.role] = entry._count.id;
  }
  const totalUsers = Object.values(roleMap).reduce((a, b) => a + b, 0);

  // build appointment status counts map
  const statusMap: Record<string, number> = {
    SCHEDULED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    MISSED: 0,
  };
  for (const entry of appointmentsByStatus) {
    statusMap[entry.status] = entry._count.id;
  }
  const totalAppointments = Object.values(statusMap).reduce((a, b) => a + b, 0);

  // build verification status breakdown for the donut chart
  const verifMap: Record<string, number> = { PENDING: 0, VERIFIED: 0, REJECTED: 0 };
  for (const entry of counselorVerificationGroups) {
    verifMap[entry.verificationStatus] = entry._count.id;
  }

  // convert bigint revenue from raw sql to a regular number
  const platformRevenue = Number(revenueResult[0]?.revenue ?? 0);

  // round average rating to one decimal place
  const avgRating = reviewStats._avg.rating
    ? Math.round(reviewStats._avg.rating * 10) / 10
    : 0;

  // build the pivot table for monthly user registration chart
  // structure: { "2025-01": { patients: 3, counselors: 1 }, ... }
  const regPivot = new Map<string, { patients: number; counselors: number }>();
  for (const row of monthlyUserRegs) {
    const existing = regPivot.get(row.month) ?? { patients: 0, counselors: 0 };
    if (row.role === "PATIENT") existing.patients = Number(row.count);
    else if (row.role === "COUNSELOR") existing.counselors = Number(row.count);
    regPivot.set(row.month, existing);
  }
  const monthlyUserRegistrations = Array.from(regPivot.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));

  // convert bigint counts from raw sql for monthly appointment trends
  const monthlyAppointmentTrends = monthlyApptTrends.map((row) => ({
    month: row.month,
    completed: Number(row.completed),
    cancelled: Number(row.cancelled),
    missed: Number(row.missed),
    scheduled: Number(row.scheduled),
  }));

  return {
    // user stats
    totalUsers,
    newUsersThisMonth,
    totalPatients: roleMap.PATIENT,
    totalCounselors: roleMap.COUNSELOR,
    verifiedCounselors: verifMap.VERIFIED,
    activeCounselors,
    pendingCounselors: verifMap.PENDING,
    rejectedCounselors: verifMap.REJECTED,
    suspendedUsers,
    bannedUsers,

    // appointment stats
    totalAppointments,
    scheduledAppointments: statusMap.SCHEDULED,
    completedAppointments: statusMap.COMPLETED,
    cancelledAppointments: statusMap.CANCELLED,
    missedAppointments: statusMap.MISSED,

    // financial + quality
    platformRevenue,
    avgPlatformRating: avgRating,
    totalReviews: reviewStats._count.id,
    totalEmotionLogs,
    totalReportsThisWeek: reportsThisWeek,

    // chart data
    monthlyUserRegistrations,
    counselorVerificationBreakdown: [
      { status: "Pending", count: verifMap.PENDING, fill: "#FFAB00" },
      { status: "Verified", count: verifMap.VERIFIED, fill: "#00796B" },
      { status: "Rejected", count: verifMap.REJECTED, fill: "#ef4444" },
    ].filter((d) => d.count > 0),

    monthlyAppointmentTrends,

    appointmentStatusDistribution: [
      { name: "Scheduled", value: statusMap.SCHEDULED, fill: "#00796B" },
      { name: "Completed", value: statusMap.COMPLETED, fill: "#10b981" },
      { name: "Cancelled", value: statusMap.CANCELLED, fill: "#ef4444" },
      { name: "Missed", value: statusMap.MISSED, fill: "#f59e0b" },
    ].filter((d) => d.value > 0),

    topSpecialties: topSpecialtiesRaw.map((r) => ({
      name: r.name,
      count: Number(r.count),
    })),

    dominantEmotions: dominantEmotionsRaw.map((r) => ({
      emotion: r.dominantEmotion,
      count: r._count.id,
    })),

    topCounselors: topCounselorsRaw.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      professionalTitle: c.professionalTitle,
      avgRating: Number(c.avgRating ?? 0),
      totalAppointments: Number(c.totalAppointments),
      primarySpecialty: specialtyMap[c.id] ?? null,
    })),

    recentReports: recentReports.map((r) => ({
      id: r.id,
      reason: r.reason,
      patientName: r.patient.fullName,
      counselorName: r.counselor.fullName,
      createdAt: r.createdAt.toISOString(),
    })),

    // snapshot
    newUsersThisWeek,
    newAppointmentsThisWeek,
    pendingVerificationsCount: verifMap.PENDING,
  };
}
