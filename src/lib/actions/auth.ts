"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

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