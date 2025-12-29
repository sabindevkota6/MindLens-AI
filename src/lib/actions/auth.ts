"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  // 1. Validate Fields
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name, role, phoneNumber } = validatedFields.data;

  // 2. Check if User Exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  // 3. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create User & Profile (Atomic Transaction)
  // This matches your ERD logic: One User, One Profile
  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        phoneNumber, // <--- 2. Add this line to save it
        // Conditionally create the profile based on role
        patientProfile: role === "PATIENT" ? {
          create: {
            fullName: name,
            bio: "", 
            // We set DOB later in settings
          }
        } : undefined,
        counselorProfile: role === "COUNSELOR" ? {
          create: {
            fullName: name,
            experienceYears: 0,
            hourlyRate: 0,
            // Verification defaults to PENDING automatically
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