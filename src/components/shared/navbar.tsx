"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNavLinksForRole } from "@/lib/chat-navigation";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LogOut, UserCircle, Menu, X } from "lucide-react";

export function AppNavbar({ role }: { role: string }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCounselor = role === "COUNSELOR";
  const navLinks = getNavLinksForRole(role);

  const { data: sessionData } = useSession();
  const userImage = sessionData?.user?.image;
  const userName = sessionData?.user?.name ?? "";
  const navInitials = userName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => setMounted(true), []);

  // close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // scroll-spy to track if #find-counselors is in view (patient only)
  useEffect(() => {
    if (isCounselor) return;
    const el = document.getElementById("find-counselors");
    if (!el) { setSectionVisible(false); return; }
    const observer = new IntersectionObserver(
      ([entry]) => setSectionVisible(entry.isIntersecting),
      { rootMargin: "-40% 0px -40% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pathname, isCounselor]);

  const dashboardPath = isCounselor ? "/dashboard/counselor" : "/dashboard/patient";
  const isOnDashboard = pathname === dashboardPath;
  const isProfile = pathname.includes("/profile");

  const getActive = (match: string) => {
    if (!mounted) return false;
    if (isCounselor) {
      if (match === "home") return pathname === "/dashboard/counselor";
      if (match === "availability") return pathname.startsWith("/dashboard/counselor/availability");
      if (match === "appointments") return pathname.startsWith("/dashboard/counselor/appointments");
      return false;
    }
    if (match === "book") return isOnDashboard && sectionVisible;
    if (match === "home") return isOnDashboard && !sectionVisible;
    if (match === "emotion") return pathname.startsWith("/dashboard/patient/emotion-test");
    if (match === "appointments") return pathname.startsWith("/dashboard/patient/appointments");
    if (match === "history") return pathname.startsWith("/dashboard/patient/history");
    return false;
  };

  const profileHref = isCounselor
    ? "/dashboard/counselor/profile"
    : "/dashboard/patient/profile";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href={dashboardPath} className="flex items-center flex-shrink-0 -ml-2 sm:-ml-8">
              <Image
                src="/MindLens-AI_ Logo.svg"
                alt="MindLens AI"
                width={150}
                height={40}
                className="object-contain h-8 w-auto"
                priority
              />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map((link) => {
                const active = getActive(link.match);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors pb-1 whitespace-nowrap ${
                      active
                        ? "after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-primary after:rounded-full"
                        : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop right: notifications + profile + sign out */}
            <div className="hidden md:flex items-center gap-3">
              <NotificationBell />
              <Link href={profileHref}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative rounded-full hover:bg-gray-100 ${
                    mounted && isProfile
                      ? "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-[3px] after:bg-primary after:rounded-full"
                      : ""
                  }`}
                >
                  {userImage ? (
                    <Avatar className="w-7 h-7 ring-2 ring-primary/20 transition-transform hover:scale-105">
                      <AvatarImage src={userImage} alt="Profile" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {navInitials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <UserCircle className="!w-6 !h-6 text-gray-700" />
                  )}
                </Button>
              </Link>
              <Button
                variant="default"
                className="rounded-full bg-black hover:bg-gray-800 text-white px-5 flex items-center gap-2"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>

            {/* Mobile right: notifications + profile avatar + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <NotificationBell />
              <Link href={profileHref} onClick={() => setMobileOpen(false)}>
                {userImage ? (
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                    <AvatarImage src={userImage} alt="Profile" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {navInitials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <UserCircle className="w-7 h-7 text-gray-700" />
                )}
              </Link>
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
              {navLinks.map((link) => {
                const active = getActive(link.match);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/8 text-primary"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {link.label}
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
