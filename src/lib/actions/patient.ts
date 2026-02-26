"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PatientOnboardingSchema, PatientProfileSchema } from "@/lib/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const getPatientProfile = async () => {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") return null;

  return await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: { email: true, phoneNumber: true, createdAt: true },
      },
    },
  });
};

export const updatePatientProfile = async (
  values: z.infer<typeof PatientProfileSchema>
) => {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return { error: "Unauthorized" };
  }

  const validated = PatientProfileSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid fields" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.patientProfile.update({
        where: { userId: session.user.id },
        data: {
          fullName: validated.data.fullName,
          dateOfBirth: new Date(validated.data.dateOfBirth),
          bio: validated.data.bio || null,
        },
      });

      if (validated.data.phoneNumber !== undefined) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { phoneNumber: validated.data.phoneNumber || null },
        });
      }
    });

    revalidatePath("/dashboard/patient/profile");
    revalidatePath("/dashboard/patient");
    return { success: "Profile updated successfully!" };
  } catch (error) {
    console.error("Patient profile update error:", error);
    return { error: "Failed to update profile." };
  }
};

// complete patient profile (onboarding)
export const completePatientProfile = async (
  values: z.infer<typeof PatientOnboardingSchema>
) => {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return { error: "Unauthorized" };
  }

  const validated = PatientOnboardingSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid fields" };
  }

  try {
    // Verify profile exists before updating
    const existingProfile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!existingProfile) {
      return { error: "Profile not found. Please log out and register again." };
    }

    await prisma.$transaction(async (tx) => {
      // update patient profile
      await tx.patientProfile.update({
        where: { userId: session.user.id },
        data: {
          dateOfBirth: new Date(validated.data.dateOfBirth),
          bio: validated.data.bio || null,
          isOnboarded: true,
        },
      });

      // update user phone number if provided
      if (validated.data.phoneNumber) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { phoneNumber: validated.data.phoneNumber },
        });
      }
    });

    revalidatePath("/dashboard/patient");
    return { success: "Profile completed successfully!" };
  } catch (error) {
    console.error("Patient profile completion error:", error);
    return { error: "Failed to complete profile." };
  }
};
