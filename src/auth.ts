import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // 1. Validate Input Structure
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        // 2. Fetch User from DB
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        // 3. Compare Password Hash (Bcrypt)
        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

        if (passwordsMatch) {
          // Return the user object (excluding the password)
          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    // This allows us to access the user's role in the session
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; 
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Redirect here if not authenticated
  },
});