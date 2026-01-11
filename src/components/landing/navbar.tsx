import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center -ml-8">
            <Image
              src="/MindLens-AI_ Logo.svg"
              alt="MindLens AI"
              width={150}
              height={40}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#support"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Our Services
            </Link>
            <Link
              href="#technology"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Our Technology
            </Link>
            <Link
              href="#experts"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Our Experts
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Testimonials
            </Link>
          </div>

          {/* Sign In Button */}
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
      </div>
    </nav>
  );
}
