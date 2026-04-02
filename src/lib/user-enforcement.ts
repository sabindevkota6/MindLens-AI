"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { format } from "date-fns";
import {
  patientSuspendWarningEmail,
  patientBanWarningEmail,
  patientSuspendedEmail,
  patientBannedEmail,
  counselorSuspendWarningEmail,
  counselorBanWarningEmail,
  counselorSuspendedEmail,
  counselorBannedEmail,
  patientUnsuspendedEmail,
  counselorUnsuspendedEmail,
} from "@/lib/email-templates";

// fetch enforcement thresholds from db, creating the row with defaults if it doesn't exist yet
async function getEnforcementThresholds() {
  return prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: {},
    update: {},
  });
}

// finds any admin user to attribute system auto-actions to in the audit log
async function getSystemAdminId(): Promise<string | null> {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  return admin?.id ?? null;
}

// called after every new report on a patient — checks total count and triggers enforcement
export async function checkPatientReportEnforcement(patientProfileId: string) {
  const [patient, reportCount, thresholds] = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
      include: { user: { select: { id: true, email: true, isBanned: true, isSuspended: true } } },
    }),
    prisma.report.count({ where: { patientProfileId } }),
    getEnforcementThresholds(),
  ]);

  if (!patient) return;
  const user = patient.user;

  // don't double-trigger if already banned
  if (user.isBanned) return;

  const name = patient.fullName;
  const email = user.email;

  if (reportCount >= thresholds.autoBanAt) {
    const adminId = await getSystemAdminId();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isBanned: true,
        isSuspended: false,
        suspendedUntil: null,
        bannedAt: new Date(),
        banReason: `Automatically banned after accumulating ${thresholds.autoBanAt} conduct reports.`,
      },
    });
    if (adminId) {
      await prisma.adminActionLog.create({
        data: {
          adminUserId: adminId,
          targetUserId: user.id,
          action: "BAN",
          reason: `Auto-ban: ${thresholds.autoBanAt} conduct reports`,
          metadata: { reportCount, auto: true },
        },
      });
    }
    sendEmail({
      to: email,
      subject: "Your MindLens AI account has been banned",
      html: patientBannedEmail({ patientName: name }),
    }).catch(console.error);
    return;
  }

  if (reportCount >= thresholds.autoSuspendAt && !user.isSuspended) {
    const adminId = await getSystemAdminId();
    const until = new Date();
    until.setDate(until.getDate() + thresholds.autoSuspendDays);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSuspended: true,
        suspendedUntil: until,
        suspendedAt: new Date(),
        suspendReason: `Automatically suspended after accumulating ${thresholds.autoSuspendAt} conduct reports.`,
      },
    });
    if (adminId) {
      await prisma.adminActionLog.create({
        data: {
          adminUserId: adminId,
          targetUserId: user.id,
          action: "SUSPEND",
          reason: `Auto-suspend: ${thresholds.autoSuspendAt} conduct reports`,
          metadata: { reportCount, days: thresholds.autoSuspendDays, auto: true },
        },
      });
    }
    sendEmail({
      to: email,
      subject: "Your MindLens AI account has been suspended",
      html: patientSuspendedEmail({
        patientName: name,
        days: thresholds.autoSuspendDays,
        suspendedUntil: format(until, "MMMM d, yyyy"),
        reason: `Accumulating ${thresholds.autoSuspendAt} conduct reports from counselors.`,
      }),
    }).catch(console.error);
    return;
  }

  // warning emails (fire once at exact thresholds)
  if (reportCount === thresholds.banWarnAt) {
    sendEmail({
      to: email,
      subject: "Final warning — your MindLens AI account is at risk of being banned",
      html: patientBanWarningEmail({ patientName: name }),
    }).catch(console.error);
    return;
  }

  if (reportCount === thresholds.suspendWarnAt) {
    sendEmail({
      to: email,
      subject: "Warning — your MindLens AI account conduct",
      html: patientSuspendWarningEmail({ patientName: name }),
    }).catch(console.error);
  }
}

// called after every new 1-star review on a counselor — checks total and triggers enforcement
export async function checkCounselorRatingEnforcement(counselorProfileId: string) {
  const [counselor, oneStarCount, thresholds] = await Promise.all([
    prisma.counselorProfile.findUnique({
      where: { id: counselorProfileId },
      include: { user: { select: { id: true, email: true, isBanned: true, isSuspended: true } } },
    }),
    prisma.review.count({
      where: {
        rating: 1,
        appointment: { counselorProfileId },
      },
    }),
    getEnforcementThresholds(),
  ]);

  if (!counselor) return;
  const user = counselor.user;

  if (user.isBanned) return;

  const name = counselor.fullName;
  const email = user.email;

  if (oneStarCount >= thresholds.autoBanAt) {
    const adminId = await getSystemAdminId();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isBanned: true,
        isSuspended: false,
        suspendedUntil: null,
        bannedAt: new Date(),
        banReason: `Automatically banned after receiving ${thresholds.autoBanAt} one-star ratings.`,
      },
    });
    if (adminId) {
      await prisma.adminActionLog.create({
        data: {
          adminUserId: adminId,
          targetUserId: user.id,
          action: "BAN",
          reason: `Auto-ban: ${thresholds.autoBanAt} one-star reviews`,
          metadata: { oneStarCount, auto: true },
        },
      });
    }
    sendEmail({
      to: email,
      subject: "Your MindLens AI counselor account has been banned",
      html: counselorBannedEmail({ counselorName: name }),
    }).catch(console.error);
    return;
  }

  if (oneStarCount >= thresholds.autoSuspendAt && !user.isSuspended) {
    const adminId = await getSystemAdminId();
    const until = new Date();
    until.setDate(until.getDate() + thresholds.autoSuspendDays);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSuspended: true,
        suspendedUntil: until,
        suspendedAt: new Date(),
        suspendReason: `Automatically suspended after receiving ${thresholds.autoSuspendAt} one-star ratings.`,
      },
    });
    if (adminId) {
      await prisma.adminActionLog.create({
        data: {
          adminUserId: adminId,
          targetUserId: user.id,
          action: "SUSPEND",
          reason: `Auto-suspend: ${thresholds.autoSuspendAt} one-star reviews`,
          metadata: { oneStarCount, days: thresholds.autoSuspendDays, auto: true },
        },
      });
    }
    sendEmail({
      to: email,
      subject: "Your MindLens AI counselor account has been suspended",
      html: counselorSuspendedEmail({
        counselorName: name,
        days: thresholds.autoSuspendDays,
        suspendedUntil: format(until, "MMMM d, yyyy"),
        reason: `Receiving ${thresholds.autoSuspendAt} one-star ratings from patients.`,
      }),
    }).catch(console.error);
    return;
  }

  if (oneStarCount === thresholds.banWarnAt) {
    sendEmail({
      to: email,
      subject: "Final warning — your MindLens AI counselor account is at risk of being banned",
      html: counselorBanWarningEmail({ counselorName: name }),
    }).catch(console.error);
    return;
  }

  if (oneStarCount === thresholds.suspendWarnAt) {
    sendEmail({
      to: email,
      subject: "Quality warning — your MindLens AI counselor account",
      html: counselorSuspendWarningEmail({ counselorName: name }),
    }).catch(console.error);
  }
}

function dashboardUrlForRole(role: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (role === "PATIENT") return `${base}/dashboard/patient`;
  if (role === "COUNSELOR") return `${base}/dashboard/counselor`;
  return `${base}/dashboard/admin`;
}

// checks if a suspended user's suspension has expired and lazily lifts it
// returns the resolved status { isBanned, isSuspended, suspendedUntil }
export async function resolveUserAccountStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, isSuspended: true, suspendedUntil: true, banReason: true, suspendReason: true },
  });

  if (!user) return null;

  // lift expired suspension lazily on access — same email pattern as manual unsuspend, with automatic: true
  if (user.isSuspended && user.suspendedUntil && user.suspendedUntil < new Date()) {
    const withProfiles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: { select: { fullName: true } },
        counselorProfile: { select: { fullName: true } },
      },
    });
    if (!withProfiles) return null;

    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false, suspendedUntil: null, suspendedAt: null, suspendReason: null },
    });

    const name =
      withProfiles.patientProfile?.fullName ?? withProfiles.counselorProfile?.fullName ?? "User";
    const dashboardUrl = dashboardUrlForRole(withProfiles.role);
    const emailHtml =
      withProfiles.role === "PATIENT"
        ? patientUnsuspendedEmail({ patientName: name, dashboardUrl, automatic: true })
        : counselorUnsuspendedEmail({ counselorName: name, dashboardUrl, automatic: true });

    sendEmail({
      to: withProfiles.email,
      subject: "Your MindLens AI account access has been restored",
      html: emailHtml,
    }).catch(console.error);

    return { isBanned: user.isBanned, isSuspended: false, suspendedUntil: null, banReason: user.banReason, suspendReason: null };
  }

  return {
    isBanned: user.isBanned,
    isSuspended: user.isSuspended,
    suspendedUntil: user.suspendedUntil,
    banReason: user.banReason,
    suspendReason: user.suspendReason,
  };
}
