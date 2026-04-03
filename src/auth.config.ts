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
        token.needsRoleSetup = user.needsRoleSetup ?? false;
        // use token.picture — nextauth's canonical field for user image in jwt
        if (user.image) token.picture = user.image;
      }

      // if the token is being refreshed (like after onboarding completes), merge the new status
      if (trigger === "update" && session?.isOnboarded !== undefined) {
        token.isOnboarded = session.isOnboarded;
      }

      // allow the /setup page to clear needsRoleSetup and update role after oauth setup
      if (trigger === "update" && "needsRoleSetup" in session) {
        token.needsRoleSetup = session.needsRoleSetup;
      }
      if (trigger === "update" && "role" in session) {
        token.role = session.role;
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
        session.user.needsRoleSetup = (token.needsRoleSetup as boolean) ?? false;
        // propagate token.picture to session.user.image so all client components see it
        // keep null (removed photo) — do not coalesce null to undefined or clients fall back to stale props
        if (token.picture !== undefined) {
          session.user.image =
            token.picture === null ? null : (token.picture as string);
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
