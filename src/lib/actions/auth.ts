"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  // validate input
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name, role } = validatedFields.data;

  // check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  // hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // create user
  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        patientProfile: role === "PATIENT" ? {
          create: {
            fullName: name,
            bio: "",
          }
        } : undefined,
        counselorProfile: role === "COUNSELOR" ? {
          create: {
            fullName: name,
            experienceYears: 0,
            hourlyRate: 0,
          }
        } : undefined,
      },
    });

    return { success: "User created! Please login." };

  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Something went wrong during registration." };
  }
};

// called from /setup page after a new oauth user picks their role and name
export const setupOAuthUser = async (role: "PATIENT" | "COUNSELOR", name: string) => {
  const session = await auth();

  // only users who came through google oauth and haven't set up yet can call this
  if (!session?.user?.needsRoleSetup) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { error: "Name is required." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // update role on the user record
      await tx.user.update({ where: { id: userId }, data: { role } });

      // create the appropriate profile
      if (role === "PATIENT") {
        await tx.patientProfile.create({
          data: { userId, fullName: trimmedName, bio: "" },
        });
      } else {
        await tx.counselorProfile.create({
          data: { userId, fullName: trimmedName, experienceYears: 0, hourlyRate: 0 },
        });
      }
    });

    return { success: true, role };
  } catch (error) {
    console.error("OAuth setup error:", error);
    return { error: "Something went wrong. Please try again." };
  }
};