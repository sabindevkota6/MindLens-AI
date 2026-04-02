"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

// small client wrapper so SessionProvider can be used inside the server root layout
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
