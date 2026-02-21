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
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative").max(80, "This value seems unrealistic"),
  hourlyRate: z.coerce.number().min(1, "Hourly rate must be at least 1"),
  specialties: z.array(z.coerce.number()).optional(), // Array of SpecialtyType IDs
  customSpecialties: z.array(z.string()).optional(), // Array of new specialty names
});

// 18+ age validation helper
const isAtLeast18 = (val: string) => {
  const date = new Date(val);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age >= 18;
};

export const CounselorOnboardingSchema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative").max(80, "This value seems unrealistic"),
  hourlyRate: z.coerce.number().min(1, "Hourly rate must be at least 1"),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine(isAtLeast18, "You must be at least 18 years old to use MindLens-AI"),
  phoneNumber: z.string().max(15, "Phone number is too long").optional(),
  specialties: z.array(z.coerce.number()).optional(),
  customSpecialties: z.array(z.string()).optional(),
}).refine(
  (data) =>
    (data.specialties?.length ?? 0) + (data.customSpecialties?.filter((s) => s.trim()).length ?? 0) > 0,
  { message: "Select or add at least one specialty", path: ["specialties"] }
);

export const PatientOnboardingSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required").refine(isAtLeast18, "You must be at least 18 years old to use MindLens-AI"),
  phoneNumber: z.string().max(15, "Phone number is too long").optional(),
  bio: z.string().optional(),
});