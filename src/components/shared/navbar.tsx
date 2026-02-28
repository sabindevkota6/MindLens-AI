"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react";

const patientNavLinks = [
  { href: "/dashboard/patient", label: "Home", match: "home" },
  { href: "/emotion-test", label: "Emotion-Test", match: "emotion" },
  { href: "/dashboard/patient#find-counselors", label: "Book a Session", match: "book" },
];

const counselorNavLinks = [
  { href: "/dashboard/counselor", label: "Home", match: "home" },
  { href: "/dashboard/counselor/availability", label: "Availability", match: "availability" },
];

export function AppNavbar({ role }: { role: string }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);

  const isCounselor = role === "COUNSELOR";
  const navLinks = isCounselor ? counselorNavLinks : patientNavLinks;

  useEffect(() => setMounted(true), []);

  // Scroll-spy to track if #find-counselors is in view (patient only)
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
      return false;
    }

    // Patient logic
    if (match === "book") return isOnDashboard && sectionVisible;
    if (match === "home") return isOnDashboard && !sectionVisible;
    if (match === "emotion") return pathname.startsWith("/emotion-test");
    return false;
  };

  const profileHref = isCounselor
    ? "/dashboard/counselor/profile"
    : "/dashboard/patient/profile";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={dashboardPath} className="flex items-center -ml-8">
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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = getActive(link.match);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors pb-1 ${
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

          {/* Profile + Sign Out */}
          <div className="flex items-center gap-3">
            <Link href={profileHref}>
              <Button
                variant="ghost"
                size="icon"
                className={`relative rounded-full hover:bg-gray-100 ${
                  mounted && isProfile
                    ? "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-primary after:rounded-full"
                    : ""
                }`}
              >
                <UserCircle className="!w-6 !h-6 text-gray-700" />
              </Button>
            </Link>
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
