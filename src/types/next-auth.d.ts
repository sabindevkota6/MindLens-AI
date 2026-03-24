import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    id?: string;
    isOnboarded?: boolean;
  }
  interface Session {
    user: User & {
      role: string;
      id: string;
      isOnboarded?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    isOnboarded?: boolean;
  }
}
