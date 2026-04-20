import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

// nextauth config with credentials and google providers
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // validate input
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        // find user with profile name
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            patientProfile: { select: { fullName: true } },
            counselorProfile: { select: { fullName: true } },
            adminProfile: { select: { fullName: true } },
          },
        });

        if (!user) return null;

        // block google-only accounts from using password login
        if (!user.passwordHash) return null;

        // check password
        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

        if (passwordsMatch) {
          const name =
            user.patientProfile?.fullName ||
            user.counselorProfile?.fullName ||
            user.adminProfile?.fullName ||
            user.email;

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            name,
            // seeds token.picture on first login so the session has the image immediately
            image: user.image ?? undefined,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    // handle google sign-in: find or create user, then flag if setup is needed
    async signIn({ user, account, profile }) {
      // credentials flow is handled by authorize above
      if (account?.provider !== "google") return true;

      const email = profile?.email;
      if (!email) return false;

      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        // returning google user or existing credentials user — link by email
        // check isOnboarded from the relevant profile
        const isOnboarded =
          existing.role === "PATIENT"
            ? (await prisma.patientProfile.findUnique({ where: { userId: existing.id }, select: { isOnboarded: true } }))?.isOnboarded ?? false
            : existing.role === "COUNSELOR"
            ? (await prisma.counselorProfile.findUnique({ where: { userId: existing.id }, select: { isOnboarded: true } }))?.isOnboarded ?? false
            : true; // admins are always "onboarded"

        user.id = existing.id;
        user.role = existing.role as string;
        user.image = existing.image ?? (profile.picture as string | undefined);
        user.needsRoleSetup = false;
        user.isOnboarded = isOnboarded;
      } else {
        // brand new google user — create a minimal account, role chosen in /setup
        const created = await prisma.user.create({
          data: {
            email,
            passwordHash: null,
            provider: "google",
            image: (profile.picture as string | null) ?? null,
            role: "PATIENT",
          },
        });
        user.id = created.id;
        user.role = "PATIENT";
        user.image = created.image ?? undefined;
        user.needsRoleSetup = true;
        user.isOnboarded = false;
      }

      return true;
    },
  },
});
