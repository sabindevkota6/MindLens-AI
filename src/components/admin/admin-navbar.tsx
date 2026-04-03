"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";

// nav link helper
function NavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative text-sm font-medium pb-1 transition-colors whitespace-nowrap text-gray-700 hover:text-gray-900 ${
        active
          ? "after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-primary after:rounded-full"
          : ""
      }`}
    >
      {children}
    </Link>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard/admin/statistics", label: "Dashboard", match: "statistics" },
  { href: "/dashboard/admin/verification", label: "Pending Verification", match: "verification" },
  { href: "/dashboard/admin/reports", label: "Reports Center", match: "reports" },
  { href: "/dashboard/admin/users/counselors", label: "User Management", match: "users" },
  { href: "/dashboard/admin/settings", label: "Settings", match: "settings" },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // close on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (match: string) => pathname.startsWith(`/dashboard/admin/${match}`);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              href="/dashboard/admin/statistics"
              className="flex shrink-0 items-center -ml-2 sm:-ml-8"
            >
              <Image
                src="/MindLens-AI_ Logo.svg"
                alt="MindLens AI"
                width={150}
                height={40}
                className="object-contain h-8 w-auto"
                priority
              />
            </Link>

            {/* Desktop nav links — centered */}
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-6 lg:gap-8 md:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} href={item.href} active={isActive(item.match)}>
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Desktop sign out + notifications */}
            <div className="hidden md:flex shrink-0 items-center gap-3">
              <NotificationBell />
              <Button
                variant="default"
                className="rounded-full bg-black hover:bg-gray-800 text-white px-5 flex items-center gap-2"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>

            {/* Mobile hamburger + notifications */}
            <div className="flex md:hidden items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* drawer panel */}
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg">
            <nav className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.match);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/8 text-primary"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
