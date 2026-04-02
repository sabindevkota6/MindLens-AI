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

const AUDIT_LOG_PAGE_SIZE = 15;

// ─── types ────────────────────────────────────────────────────────────────────

export type PlatformSettingsData = {
  id: string;
  suspendWarnAt: number;
  autoSuspendAt: number;
  autoSuspendDays: number;
  banWarnAt: number;
  autoBanAt: number;
  updatedAt: string;
};

export type EnforcementUpdateInput = {
  suspendWarnAt: number;
  autoSuspendAt: number;
  autoSuspendDays: number;
  banWarnAt: number;
  autoBanAt: number;
};

export type SpecialtyWithCount = {
  id: number;
  name: string;
  counselorCount: number;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  reason: string | null;
  createdAt: string;
  adminName: string | null;
  adminEmail: string;
  targetName: string | null;
  targetEmail: string;
  targetRole: string;
  metadata: Record<string, unknown> | null;
};

export type AuditLogSearchParams = {
  action?: string;
  dateRange?: "all" | "week" | "month";
  page?: number;
};

// ─── enforcement settings ─────────────────────────────────────────────────────

// get or create the platform settings singleton row with defaults
export async function getPlatformSettings(): Promise<PlatformSettingsData | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const row = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: {},
    update: {},
  });

  return {
    id: row.id,
    suspendWarnAt: row.suspendWarnAt,
    autoSuspendAt: row.autoSuspendAt,
    autoSuspendDays: row.autoSuspendDays,
    banWarnAt: row.banWarnAt,
    autoBanAt: row.autoBanAt,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// validate thresholds are strictly ascending before saving
export async function updateEnforcementSettings(
  data: EnforcementUpdateInput
): Promise<PlatformSettingsData | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const { suspendWarnAt, autoSuspendAt, autoSuspendDays, banWarnAt, autoBanAt } = data;

  // all values must be positive integers
  if ([suspendWarnAt, autoSuspendAt, autoSuspendDays, banWarnAt, autoBanAt].some((v) => !Number.isInteger(v) || v < 1)) {
    return { error: "All values must be positive whole numbers." };
  }

  // thresholds must be strictly ascending
  if (!(suspendWarnAt < autoSuspendAt && autoSuspendAt < banWarnAt && banWarnAt < autoBanAt)) {
    return { error: "Thresholds must be in strictly ascending order: Warn < Auto-Suspend < Final Warn < Auto-Ban." };
  }

  // auto-suspend days cap
  if (autoSuspendDays > 365) {
    return { error: "Auto-suspend duration cannot exceed 365 days." };
  }

  const row = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: data,
    update: data,
  });

  return {
    id: row.id,
    suspendWarnAt: row.suspendWarnAt,
    autoSuspendAt: row.autoSuspendAt,
    autoSuspendDays: row.autoSuspendDays,
    banWarnAt: row.banWarnAt,
    autoBanAt: row.autoBanAt,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── specialty directory ──────────────────────────────────────────────────────

// fetch specialties with counselor count using _count on the relation
export async function getSpecialtiesWithCounts(): Promise<SpecialtyWithCount[] | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const rows = await prisma.specialtyType.findMany({
    include: { _count: { select: { counselors: true } } },
    orderBy: { name: "asc" },
  });

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    counselorCount: s._count.counselors,
  }));
}

// add a new specialty, rejecting duplicates regardless of case
export async function addSpecialty(name: string): Promise<SpecialtyWithCount | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Specialty name cannot be empty." };

  // capitalize first letter
  const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  // check for case-insensitive duplicate
  const existing = await prisma.specialtyType.findFirst({
    where: { name: { equals: formatted, mode: "insensitive" } },
  });
  if (existing) return { error: "A specialty with this name already exists." };

  const created = await prisma.specialtyType.create({ data: { name: formatted } });

  return { id: created.id, name: created.name, counselorCount: 0 };
}

// delete only allowed if no counselors are currently using this specialty
export async function deleteSpecialty(id: number): Promise<{ success: true } | { error: string }> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const usageCount = await prisma.counselorSpecialty.count({ where: { specialtyId: id } });
  if (usageCount > 0) {
    return { error: `This specialty is used by ${usageCount} counselor${usageCount === 1 ? "" : "s"} and cannot be deleted.` };
  }

  await prisma.specialtyType.delete({ where: { id } });
  return { success: true };
}

// ─── audit log ────────────────────────────────────────────────────────────────

// paginated audit log with optional action type and date range filters
export async function searchAuditLog(params: AuditLogSearchParams = {}): Promise<
  | { logs: AuditLogEntry[]; total: number; page: number; totalPages: number }
  | { error: string }
> {
  const session = await assertAdmin();
  if (!session) return { error: "Unauthorized" };

  const page = Math.max(1, params.page ?? 1);
  const now = new Date();

  const where: Prisma.AdminActionLogWhereInput = {};

  // filter by specific action type if provided
  if (params.action && params.action !== "all") {
    where.action = params.action as Prisma.EnumAdminActionFilter["equals"];
  }

  // date range filter on createdAt
  if (params.dateRange === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    where.createdAt = { gte: weekAgo };
  } else if (params.dateRange === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    where.createdAt = { gte: monthAgo };
  }

  const [rows, total] = await Promise.all([
    prisma.adminActionLog.findMany({
      where,
      include: {
        admin: {
          select: {
            email: true,
            adminProfile: { select: { fullName: true } },
          },
        },
        targetUser: {
          select: {
            email: true,
            role: true,
            patientProfile: { select: { fullName: true } },
            counselorProfile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_LOG_PAGE_SIZE,
      take: AUDIT_LOG_PAGE_SIZE,
    }),
    prisma.adminActionLog.count({ where }),
  ]);

  const logs: AuditLogEntry[] = rows.map((r) => ({
    id: r.id,
    action: r.action,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    adminName: r.admin.adminProfile?.fullName ?? null,
    adminEmail: r.admin.email,
    targetName:
      r.targetUser.patientProfile?.fullName ?? r.targetUser.counselorProfile?.fullName ?? null,
    targetEmail: r.targetUser.email,
    targetRole: r.targetUser.role,
    metadata: r.metadata ? (r.metadata as Record<string, unknown>) : null,
  }));

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / AUDIT_LOG_PAGE_SIZE),
  };
}
