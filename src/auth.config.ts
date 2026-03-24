import type { NextAuthConfig } from "next-auth";

// auth config for edge runtime
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // add role, id, and onboarding status to jwt
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isOnboarded = user.isOnboarded;
      }
      
      // if the token is being refreshed (like after onboarding completes), merge the new status
      if (trigger === "update" && session?.isOnboarded !== undefined) {
        token.isOnboarded = session.isOnboarded;
      }
      
      return token;
    },
    // add role, id, and onboarding status to session
    session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.isOnboarded = token.isOnboarded as boolean;
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
