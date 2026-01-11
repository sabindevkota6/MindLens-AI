import * as z from "zod";

export const RegisterSchema = z.object({
  name: z.string()
    .min(1, "Full name is required")
    .refine(
      (value) => value.trim().split(/\s+/).length >= 2,
      "Enter first and last name"
    ),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
    .min(1, "Confirm your password"),
  // phoneNumber removed
  role: z.enum(["PATIENT", "COUNSELOR"], {
    message: "Select a role",
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

// counselor profile update schema (kept for legacy/edit usage if needed, or replaced by Onboarding)
// counselor profile update schema
export const CounselorProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative"),
  hourlyRate: z.coerce.number().min(1, "Hourly rate must be at least 1"),
  specialties: z.array(z.coerce.number()).optional(), // Array of SpecialtyType IDs
  customSpecialties: z.array(z.string()).optional(), // Array of new specialty names
});

export const CounselorOnboardingSchema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative"),
  hourlyRate: z.coerce.number().min(1, "Hourly rate must be at least 1"),
  phoneNumber: z.string().optional(),
});