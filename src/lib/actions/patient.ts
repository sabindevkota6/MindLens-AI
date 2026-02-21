"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PatientOnboardingSchema } from "@/lib/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// get patient profile data
export const getPatientProfile = async () => {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") return null;

  return await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
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
