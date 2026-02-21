"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/emotion-test", label: "Emotion-Test" },
  { href: "/book-session", label: "Book a Session" },
];

export function AppNavbar() {
  const pathname = usePathname();

  // derive profile link from current route
  const profileHref = pathname.startsWith("/dashboard/counselor")
    ? "/dashboard/counselor/profile"
    : "/dashboard/patient/profile";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center -ml-8">
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "text-primary"
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Profile + Sign Out */}
          <div className="flex items-center gap-3">
            <Link href={profileHref}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100"
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
