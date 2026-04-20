"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// guard: only admin can call these actions
async function assertAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

const REPORTS_PAGE_SIZE = 12;

export type AdminReportStats = {
  totalReports: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  patientsAtRisk: number;
  patientsHighRisk: number;
};

export type AdminReportListItem = {
  reportId: string;
  reason: string;
  createdAt: string;
  // patient info
  patientId: string;
  patientUserId: string;
  patientName: string;
  patientTotalReports: number;
  patientIsBanned: boolean;
  patientIsSuspended: boolean;
  patientSuspendedUntil: string | null;
  // counselor info
  counselorId: string;
  counselorName: string;
  // appointment info
  appointmentId: string;
  appointmentSlotStart: string;
};

export type AtRiskPatient = {
  patientId: string;
  patientUserId: string;
  fullName: string;
  totalReports: number;
  isBanned: boolean;
  isSuspended: boolean;
};

export type AdminReportSearchParams = {
  query?: string;
  riskLevel?: "all" | "clean" | "warning" | "highrisk";
  dateRange?: "all" | "week" | "month";
  sortBy?: "newest" | "mostReported";
  page?: number;
};

// get platform-wide report stats for the hero chips
export async function getAdminReportStats(): Promise<AdminReportStats | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setMonth(now.getMonth() - 1);

  // get report counts and patient groupings in parallel
  const [totalReports, reportsThisWeek, reportsThisMonth, allPatientCounts] =
    await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.report.count({ where: { createdAt: { gte: monthAgo } } }),
      // group reports by patient to find risk tiers
      prisma.report.groupBy({
        by: ["patientProfileId"],
        _count: { id: true },
      }),
    ]);

  // at risk patients with 7 to 19 reports
  const atRiskIds = allPatientCounts
    .filter((r) => r._count.id >= 7 && r._count.id < 20)
    .map((r) => r.patientProfileId);

  const highRiskIds = allPatientCounts
    .filter((r) => r._count.id >= 15)
    .map((r) => r.patientProfileId);

  // check how many of those patients are not yet banned
  const [patientsAtRisk, patientsHighRisk] = await Promise.all([
    atRiskIds.length > 0
      ? prisma.patientProfile.count({
          where: { id: { in: atRiskIds }, user: { isBanned: false } },
        })
      : Promise.resolve(0),
    highRiskIds.length > 0
      ? prisma.patientProfile.count({
          where: { id: { in: highRiskIds }, user: { isBanned: false } },
        })
      : Promise.resolve(0),
  ]);

  return {
    totalReports,
    reportsThisWeek,
    reportsThisMonth,
    patientsAtRisk,
    patientsHighRisk,
  };
}

// search and paginate reports with optional filters
export async function searchAdminReports(params: AdminReportSearchParams = {}): Promise<
  | { reports: AdminReportListItem[]; total: number; page: number; totalPages: number }
  | { error: string }
> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const page = Math.max(1, params.page ?? 1);
  const now = new Date();

  // build the date range filter
  let createdAtFilter: Prisma.ReportWhereInput["createdAt"] | undefined;
  if (params.dateRange === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    createdAtFilter = { gte: weekAgo };
  } else if (params.dateRange === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    createdAtFilter = { gte: monthAgo };
  }

  // risk filter thresholds
  let riskPatientIds: string[] | undefined;
  if (params.riskLevel && params.riskLevel !== "all") {
    const allCounts = await prisma.report.groupBy({
      by: ["patientProfileId"],
      _count: { id: true },
    });
    riskPatientIds = allCounts
      .filter((r) => {
        const c = r._count.id;
        if (params.riskLevel === "clean") return c < 7;
        if (params.riskLevel === "warning") return c >= 7 && c < 15;
        if (params.riskLevel === "highrisk") return c >= 15;
        return true;
      })
      .map((r) => r.patientProfileId);
  }

  // assemble the where clause
  const where: Prisma.ReportWhereInput = {};

  if (createdAtFilter) where.createdAt = createdAtFilter;

  if (riskPatientIds !== undefined) {
    where.patientProfileId = { in: riskPatientIds };
  }

  if (params.query?.trim()) {
    const q = params.query.trim();
    where.OR = [
      { patient: { fullName: { contains: q, mode: "insensitive" } } },
      { counselor: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }

  // fetch reports and total count in parallel
  const [rows, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            // use _count to avoid loading all report ids (avoids N+1)
            _count: { select: { reports: true } },
            user: {
              select: {
                id: true,
                isBanned: true,
                isSuspended: true,
                suspendedUntil: true,
              },
            },
          },
        },
        counselor: {
          select: { id: true, fullName: true },
        },
        appointment: {
          select: {
            id: true,
            slot: { select: { startTime: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * REPORTS_PAGE_SIZE,
      take: REPORTS_PAGE_SIZE,
    }),
    prisma.report.count({ where }),
  ]);

  let reports: AdminReportListItem[] = rows.map((r) => ({
    reportId: r.id,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    patientId: r.patient.id,
    patientUserId: r.patient.user.id,
    patientName: r.patient.fullName,
    patientTotalReports: r.patient._count.reports,
    patientIsBanned: r.patient.user.isBanned,
    patientIsSuspended: r.patient.user.isSuspended,
    patientSuspendedUntil: r.patient.user.suspendedUntil?.toISOString() ?? null,
    counselorId: r.counselor.id,
    counselorName: r.counselor.fullName,
    appointmentId: r.appointment.id,
    appointmentSlotStart: r.appointment.slot.startTime.toISOString(),
  }));

  // sort by patient total report count within the page if requested
  if (params.sortBy === "mostReported") {
    reports.sort((a, b) => b.patientTotalReports - a.patientTotalReports);
  }

  return {
    reports,
    total,
    page,
    totalPages: Math.ceil(total / REPORTS_PAGE_SIZE),
  };
}

// get all patients with ≥7 reports who are not yet banned
export async function getAtRiskPatients(): Promise<AtRiskPatient[] | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  // get total report counts per patient sorted by highest first
  const patientCounts = await prisma.report.groupBy({
    by: ["patientProfileId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // only care about patients with 7+ reports
  const qualifyingCounts = patientCounts.filter((r) => r._count.id >= 7);
  if (qualifyingCounts.length === 0) return [];

  const patientIds = qualifyingCounts.map((r) => r.patientProfileId);

  // fetch profile info for those patients, excluding already-banned ones
  const profiles = await prisma.patientProfile.findMany({
    where: {
      id: { in: patientIds },
      user: { isBanned: false },
    },
    select: {
      id: true,
      fullName: true,
      user: {
        select: { id: true, isBanned: true, isSuspended: true },
      },
    },
  });

  // merge report counts back using a map for O(1) lookup
  const countMap = new Map(
    qualifyingCounts.map((r) => [r.patientProfileId, r._count.id])
  );

  return profiles
    .map((p) => ({
      patientId: p.id,
      patientUserId: p.user.id,
      fullName: p.fullName,
      totalReports: countMap.get(p.id) ?? 0,
      isBanned: p.user.isBanned,
      isSuspended: p.user.isSuspended,
    }))
    .sort((a, b) => b.totalReports - a.totalReports);
}
