"use server";

import { AuthError } from "next-auth";
import type { z } from "zod";

import { signIn } from "@/auth";
import { LoginSchema } from "@/lib/schemas";

type LoginValues = z.infer<typeof LoginSchema>;

export async function login(values: LoginValues) {
  // validate input
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return { fieldErrors };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { success: "Logged in successfully!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }

    // rethrow for redirect
    throw error;
  }
}
