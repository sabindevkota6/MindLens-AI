import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

// nextauth config with credentials provider
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
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
          };
        }

        return null;
      },
    }),
  ],
});