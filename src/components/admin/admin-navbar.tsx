"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// nav link helper
function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative text-sm font-medium pb-1 transition-colors text-gray-700 hover:text-gray-900 ${
        active
          ? "after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-primary after:rounded-full"
          : ""
      }`}
    >
      {children}
    </Link>
  );
}

export function AdminNavbar() {
  const pathname = usePathname();

  const dashboardActive = pathname.startsWith("/dashboard/admin/statistics");
  const verificationActive = pathname.startsWith("/dashboard/admin/verification");
  const reportsActive = pathname.startsWith("/dashboard/admin/reports");
  const usersActive = pathname.startsWith("/dashboard/admin/users");
  const settingsActive = pathname.startsWith("/dashboard/admin/settings");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/dashboard/admin/statistics"
            className="flex shrink-0 items-center -ml-8"
          >
            <Image
              src="/MindLens-AI_ Logo.svg"
              alt="MindLens AI"
              width={150}
              height={40}
              className="object-contain"
              style={{ width: "auto", height: "auto" }}
              priority
            />
          </Link>

          {/* centered nav — same pattern as AppNavbar (logo | links | actions) */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-8 md:flex">
            <NavLink href="/dashboard/admin/statistics" active={dashboardActive}>
              Dashboard
            </NavLink>

            <NavLink href="/dashboard/admin/verification" active={verificationActive}>
              Pending Verification
            </NavLink>

            <NavLink href="/dashboard/admin/reports" active={reportsActive}>
              Reports Center
            </NavLink>

            <NavLink href="/dashboard/admin/users/counselors" active={usersActive}>
              User Management
            </NavLink>

            <NavLink href="/dashboard/admin/settings" active={settingsActive}>
              Settings
            </NavLink>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Button
              variant="default"
              className="rounded-full bg-black hover:bg-gray-800 text-white px-6 flex items-center gap-2"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
