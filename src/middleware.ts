import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// middleware for auth and role-based access

const { auth } = NextAuth(authConfig);

// route definitions
const publicRoutes = ["/", "/about", "/counselors"];
const authRoutes = ["/login", "/register"];
const apiAuthPrefix = "/api/auth";

// dashboard routes for each role
const dashboardRoutes = {
  patient: "/dashboard/patient",
  counselor: "/dashboard/counselor",
  admin: "/dashboard/admin",
} as const;

// get dashboard based on role
function getDefaultDashboard(role: string | undefined): string {
  if (role === "COUNSELOR") return dashboardRoutes.counselor;
  if (role === "ADMIN") return dashboardRoutes.admin;
  return dashboardRoutes.patient;
}

// check if user can access the dashboard
function hasRoleAccess(role: string | undefined, pathname: string): boolean {
  if (pathname.startsWith(dashboardRoutes.counselor)) {
    return role === "COUNSELOR";
  }
  if (pathname.startsWith(dashboardRoutes.admin)) {
    return role === "ADMIN";
  }
  if (pathname.startsWith(dashboardRoutes.patient)) {
    return role === "PATIENT";
  }
  return true;
}

// main middleware
export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role as string | undefined;

  // allow nextauth api routes
  if (pathname.startsWith(apiAuthPrefix)) {
    return;
  }

  // handle login/register pages
  const isAuthRoute = authRoutes.includes(pathname);
  if (isAuthRoute) {
    if (isLoggedIn) {
      const redirectUrl = getDefaultDashboard(userRole);
      return Response.redirect(new URL(redirectUrl, nextUrl));
    }
    return;
  }

  // handle dashboard routes
  const isProtectedRoute = pathname.startsWith("/dashboard");
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }

    // check role access
    if (!hasRoleAccess(userRole, pathname)) {
      const correctDashboard = getDefaultDashboard(userRole);
      return Response.redirect(new URL(correctDashboard, nextUrl));
    }

    return;
  }

  return;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};