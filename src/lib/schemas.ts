import * as z from "zod";

export const RegisterSchema = z.object({
  name: z.string()
    .min(1, "Full name is required")
    .refine(
      (value) => value.trim().split(/\s+/).length >= 2,
      "Please enter your full name (first and last name)"
    ),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
    .min(1, "Please confirm your password"),
  phoneNumber: z.string().optional(),
  role: z.enum(["PATIENT", "COUNSELOR"], {
    message: "Please select a role",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});