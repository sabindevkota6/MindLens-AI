"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogIn, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#support", label: "Our Services" },
  { href: "#technology", label: "Our Technology" },
  { href: "#experts", label: "Our Experts" },
  { href: "#testimonials", label: "Testimonials" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 -ml-2 sm:-ml-8">
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
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Sign In */}
            <div className="hidden md:flex">
              <Link href="/login">
                <Button
                  variant="default"
                  className="rounded-full bg-black hover:bg-gray-800 text-white px-6 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Mobile: Sign In + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <Link href="/login">
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full bg-black hover:bg-gray-800 text-white px-4 flex items-center gap-1.5 text-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Button>
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold h-11">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
