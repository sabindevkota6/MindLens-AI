import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    id?: string;
    isOnboarded?: boolean;
    image?: string | null;
  }
  interface Session {
    user: User & {
      role: string;
      id: string;
      isOnboarded?: boolean;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    isOnboarded?: boolean;
    // note: nextauth already declares `picture` on jwt — no need to redeclare
  }
}
