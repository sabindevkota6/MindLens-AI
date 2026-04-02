import type { NextAuthConfig } from "next-auth";

// auth config for edge runtime
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // add role, id, onboarding status, and profile picture to jwt
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isOnboarded = user.isOnboarded;
        // use token.picture — nextauth's canonical field for user image in jwt
        if (user.image) token.picture = user.image;
      }

      // if the token is being refreshed (like after onboarding completes), merge the new status
      if (trigger === "update" && session?.isOnboarded !== undefined) {
        token.isOnboarded = session.isOnboarded;
      }

      // refresh profile image after upload or removal
      // "image" in session handles both a new url and explicit null (removal)
      if (trigger === "update" && "image" in session) {
        token.picture = (session.image as string | null) ?? null;
      }

      return token;
    },
    // add role, id, onboarding status, and image to session
    session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.isOnboarded = token.isOnboarded as boolean;
        // propagate token.picture to session.user.image so all client components see it
        if (token.picture !== undefined) {
          session.user.image = (token.picture as string | null) ?? undefined;
        }
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
