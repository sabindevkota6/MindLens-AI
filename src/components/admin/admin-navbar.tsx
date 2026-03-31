"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// same shell as app navbar: white bar, primary underline on active link
export function AdminNavbar() {
  const pathname = usePathname();
  const verificationActive = pathname.startsWith(
    "/dashboard/admin/verification"
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/dashboard/admin/verification"
            className="flex items-center -ml-8"
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

          <div className="flex items-center gap-3 md:gap-6">
            <Link
              href="/dashboard/admin/verification"
              className={`relative text-sm font-medium pb-1 transition-colors ${
                verificationActive
                  ? "text-gray-900 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-primary after:rounded-full"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Pending Verification
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
