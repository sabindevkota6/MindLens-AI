import type { NextAuthConfig } from "next-auth";

// auth config for edge runtime
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // add role and id to jwt
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    // add role and id to session
    session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
    // check if user can access dashboard
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        return isLoggedIn;
      }
      return true;
    },
  },
  providers: [], // providers in auth.ts
} satisfies NextAuthConfig;
