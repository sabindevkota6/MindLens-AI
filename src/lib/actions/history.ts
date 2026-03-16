"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// fetching historical emotion data for the patient's journey view
export const getEmotionHistory = async () => {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") return [];

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return [];

  const logs = await prisma.emotionLog.findMany({
    where: { patientProfileId: profile.id },
    orderBy: { recordedAt: "desc" },
    select: {
      id: true,
      dominantEmotion: true,
      recordedAt: true,
    },
  });

  return logs;
};

// fetching a single log by id — also verifies the log belongs to this patient
export const getEmotionLogById = async (logId: string) => {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") return null;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return null;

  const log = await prisma.emotionLog.findUnique({
    where: { id: logId },
  });

  // security check — patient can only view their own logs
  if (!log || log.patientProfileId !== profile.id) return null;

  return { log, profileId: profile.id };
};
