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
} from "@/lib/email-templates";

// thresholds for patient report-based enforcement
const PATIENT_SUSPEND_WARN_AT = 7;
const PATIENT_BAN_WARN_AT = 15;
const PATIENT_AUTO_SUSPEND_AT = 10;
const PATIENT_AUTO_BAN_AT = 20;
const AUTO_SUSPEND_DAYS = 5;

// thresholds for counselor 1-star rating enforcement
const COUNSELOR_SUSPEND_WARN_AT = 7;
const COUNSELOR_BAN_WARN_AT = 15;
const COUNSELOR_AUTO_SUSPEND_AT = 10;
const COUNSELOR_AUTO_BAN_AT = 20;

// finds any admin user to attribute system auto-actions to in the audit log
async function getSystemAdminId(): Promise<string | null> {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  return admin?.id ?? null;
}

// called after every new report on a patient — checks total count and triggers enforcement
export async function checkPatientReportEnforcement(patientProfileId: string) {
  const [patient, reportCount] = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
      include: { user: { select: { id: true, email: true, isBanned: true, isSuspended: true } } },
    }),
    prisma.report.count({ where: { patientProfileId } }),
  ]);

  if (!patient) return;
  const user = patient.user;

  // don't double-trigger if already banned
  if (user.isBanned) return;

  const name = patient.fullName;
  const email = user.email;

  if (reportCount >= PATIENT_AUTO_BAN_AT) {
    const adminId = await getSystemAdminId();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isBanned: true,
        isSuspended: false,
        suspendedUntil: null,
        bannedAt: new Date(),
        banReason: "Automatically banned after accumulating 20 conduct reports.",
      },
    });
    if (adminId) {
      await prisma.adminActionLog.create({
        data: {
          adminUserId: adminId,
          targetUserId: user.id,
          action: "BAN",
          reason: "Auto-ban: 20 conduct reports",
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

  if (reportCount >= PATIENT_AUTO_SUSPEND_AT && !user.isSuspended) {
    const adminId = await getSystemAdminId();
    const until = new Date();
    until.setDate(until.getDate() + AUTO_SUSPEND_DAYS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSuspended: true,
        suspendedUntil: until,
        suspendedAt: new Date(),
        suspendReason: "Automatically suspended after accumulating 10 conduct reports.",
      },
    });
    if (adminId) {
      await prisma.adminActionLog.create({
        data: {
          adminUserId: adminId,
          targetUserId: user.id,
          action: "SUSPEND",
          reason: "Auto-suspend: 10 conduct reports",
          metadata: { reportCount, days: AUTO_SUSPEND_DAYS, auto: true },
        },
      });
    }
    sendEmail({
      to: email,
      subject: "Your MindLens AI account has been suspended",
      html: patientSuspendedEmail({
        patientName: name,
        days: AUTO_SUSPEND_DAYS,
        suspendedUntil: format(until, "MMMM d, yyyy"),
        reason: "Accumulating 10 conduct reports from counselors.",
      }),
    }).catch(console.error);
    return;
  }

  // warning emails (fire once at exact thresholds)
  if (reportCount === PATIENT_BAN_WARN_AT) {
    sendEmail({
      to: email,
      subject: "Final warning — your MindLens AI account is at risk of being banned",
      html: patientBanWarningEmail({ patientName: name }),
    }).catch(console.error);
    return;
  }

  if (reportCount === PATIENT_SUSPEND_WARN_AT) {
    sendEmail({
      to: email,
      subject: "Warning — your MindLens AI account conduct",
      html: patientSuspendWarningEmail({ patientName: name }),
    }).catch(console.error);
  }
}

// called after every new 1-star review on a counselor — checks total and triggers enforcement
export async function checkCounselorRatingEnforcement(counselorProfileId: string) {
  const [counselor, oneStarCount] = await Promise.all([
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
  ]);

  if (!counselor) return;
  const user = counselor.user;

  if (user.isBanned) return;

  const name = counselor.fullName;
  const email = user.email;

  if (oneStarCount >= COUNSELOR_AUTO_BAN_AT) {
    const adminId = await getSystemAdminId();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isBanned: true,
        isSuspended: false,
        suspendedUntil: null,
        bannedAt: new Date(),
        banReason: "Automatically banned after receiving 20 one-star ratings.",
      },
    });
    if (adminId) {
      await prisma.adminActionLog.create({
        data: {
          adminUserId: adminId,
          targetUserId: user.id,
          action: "BAN",
          reason: "Auto-ban: 20 one-star reviews",
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

  if (oneStarCount >= COUNSELOR_AUTO_SUSPEND_AT && !user.isSuspended) {
    const adminId = await getSystemAdminId();
    const until = new Date();
    until.setDate(until.getDate() + AUTO_SUSPEND_DAYS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSuspended: true,
        suspendedUntil: until,
        suspendedAt: new Date(),
        suspendReason: "Automatically suspended after receiving 10 one-star ratings.",
      },
    });
    if (adminId) {
      await prisma.adminActionLog.create({
        data: {
          adminUserId: adminId,
          targetUserId: user.id,
          action: "SUSPEND",
          reason: "Auto-suspend: 10 one-star reviews",
          metadata: { oneStarCount, days: AUTO_SUSPEND_DAYS, auto: true },
        },
      });
    }
    sendEmail({
      to: email,
      subject: "Your MindLens AI counselor account has been suspended",
      html: counselorSuspendedEmail({
        counselorName: name,
        days: AUTO_SUSPEND_DAYS,
        suspendedUntil: format(until, "MMMM d, yyyy"),
        reason: "Receiving 10 one-star ratings from patients.",
      }),
    }).catch(console.error);
    return;
  }

  if (oneStarCount === COUNSELOR_BAN_WARN_AT) {
    sendEmail({
      to: email,
      subject: "Final warning — your MindLens AI counselor account is at risk of being banned",
      html: counselorBanWarningEmail({ counselorName: name }),
    }).catch(console.error);
    return;
  }

  if (oneStarCount === COUNSELOR_SUSPEND_WARN_AT) {
    sendEmail({
      to: email,
      subject: "Quality warning — your MindLens AI counselor account",
      html: counselorSuspendWarningEmail({ counselorName: name }),
    }).catch(console.error);
  }
}

// checks if a suspended user's suspension has expired and lazily lifts it
// returns the resolved status { isBanned, isSuspended, suspendedUntil }
export async function resolveUserAccountStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, isSuspended: true, suspendedUntil: true, banReason: true, suspendReason: true },
  });

  if (!user) return null;

  // lift expired suspension lazily on access
  if (user.isSuspended && user.suspendedUntil && user.suspendedUntil < new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false, suspendedUntil: null, suspendedAt: null, suspendReason: null },
    });
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
