# MindLens-AI Developer Guide

## Project Overview
Mental health platform connecting patients with counselors through AI-powered emotion analysis. Built with Next.js 16 (App Router), NextAuth v5, Prisma ORM, and PostgreSQL.

## Architecture & Data Flow

### Role-Based System
Three distinct user roles drive the entire architecture:
- **PATIENT**: Creates PatientProfile on registration, accesses `/dashboard/patient`
- **COUNSELOR**: Creates CounselorProfile on registration, completes onboarding wizard, accesses `/dashboard/counselor`
- **ADMIN**: Creates AdminProfile, accesses `/dashboard/admin`

Profile creation happens **atomically during registration** in [`src/lib/actions/auth.ts`](src/lib/actions/auth.ts) - the User and corresponding profile are created in a single transaction.

### Authentication Flow (NextAuth v5)
- **Config split**: [`auth.config.ts`](src/auth.config.ts) for edge runtime (callbacks, redirects), [`auth.ts`](src/auth.ts) for providers
- **Session enrichment**: JWT and session callbacks add `role` and `id` from User model (see [`types/next-auth.d.ts`](src/types/next-auth.d.ts))
- **Route protection**: [`middleware.ts`](src/middleware.ts) handles role-based redirects:
  - Logged-in users visiting `/login` or `/register` → redirected to role-specific dashboard
  - Unauthorized role accessing protected dashboard → redirected to their correct dashboard
  - Not logged in → redirected to `/login?callbackUrl=...`

### Database Patterns (Prisma)
- **One-to-one profiles**: Each User has exactly one profile (PatientProfile/CounselorProfile/AdminProfile) with `onDelete: Cascade`
- **Bridge tables**: `CounselorSpecialty` links counselors to specialties (many-to-many)
- **Decimal handling**: `hourlyRate` is Prisma Decimal - always convert to Number when returning from server actions: `hourlyRate: Number(profile.hourlyRate)`
- **Unique constraints**: `@@unique([counselorProfileId, specialtyId])` prevents duplicate specialty assignments

## Critical Workflows

### Development Commands
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npx prisma studio        # Visual database browser
npx prisma migrate dev   # Create and apply migrations
npx prisma generate      # Regenerate Prisma Client after schema changes
```

### Counselor Onboarding
New counselors see [`ProfileWizard`](src/components/counselor/profile-wizard.tsx) modal on first dashboard visit:
1. **Step 1**: Bio, experience, hourly rate, phone
2. **Step 2**: Upload verification document (license/certificate)
3. Completion triggers profile creation via [`completeCounselorProfile`](src/lib/actions/counselor.ts)
4. Dashboard displays greeting only after profile completion check

Profile completion logic in [`dashboard/counselor/page.tsx`](src/app/dashboard/counselor/page.tsx):
```typescript
const isProfileComplete = hasBio && hasExperience && hasRate &&
  (profile?.verificationStatus === "VERIFIED" || hasDocs);
```

## Code Conventions

### Server Actions Pattern
All mutations go through server actions (`"use server"` directive) in `src/lib/actions/`:
- Always check authentication: `const session = await auth()`
- Validate with Zod schemas from [`lib/schemas.ts`](src/lib/schemas.ts)
- Use `revalidatePath()` after mutations to refresh cached data
- Return `{ error: string }` or `{ success: string }` for UI feedback

Example from [`counselor.ts`](src/lib/actions/counselor.ts):
```typescript
export const updateCounselorProfile = async (values: z.infer<typeof CounselorProfileSchema>) => {
  const session = await auth();
  if (!session || session.user.role !== "COUNSELOR") {
    return { error: "Unauthorized" };
  }
  // ... validation and mutation
  revalidatePath("/dashboard/counselor/profile");
  return { success: "Profile updated" };
};
```

### Form Handling
Use `react-hook-form` + `@hookform/resolvers/zod`:
- Forms are client components (`"use client"`)
- Use `useTransition` for pending states during server action calls
- Shadcn/ui Form components wrap react-hook-form fields (see [`components/ui/form.tsx`](src/components/ui/form.tsx))

### UI Components (Shadcn/ui)
- Located in `src/components/ui/`
- Built on Radix UI primitives with Tailwind CSS
- Use `cn()` utility from [`lib/utils.ts`](src/lib/utils.ts) for conditional classes
- Theming via CSS variables in [`app/globals.css`](src/app/globals.css), configured in [`tailwind.config.ts`](tailwind.config.ts)

### TypeScript
- All files use strict TypeScript
- Infer types from Zod schemas: `z.infer<typeof SchemaName>`
- Prisma types auto-generated: `import { User, Role } from "@prisma/client"`
- Extend NextAuth types in [`types/next-auth.d.ts`](src/types/next-auth.d.ts)

## Key Integration Points

### Prisma Client Singleton
Import from [`lib/prisma.ts`](src/lib/prisma.ts), not `@prisma/client` directly:
```typescript
import { prisma } from "@/lib/prisma";
```
Prevents multiple instances in development (hot reload issue).

### Middleware Matcher
Exclude static assets from auth middleware ([`middleware.ts`](src/middleware.ts)):
```typescript
matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg)$).*)"]
```

### Route Groups
- `(auth)` directory groups login/register without affecting URL paths
- Dashboard role routes are flat: `/dashboard/patient`, `/dashboard/counselor`, `/dashboard/admin`

## Future Features (Database Schema Ready)
The schema includes models for features not yet implemented:
- **EmotionLog**: Hume AI emotion analysis integration
- **Appointment + AvailabilitySlot**: Booking system with meeting links
- **Review**: Post-appointment ratings
- **SpecialtyType**: Counselor filtering (DB ready, UI pending)
