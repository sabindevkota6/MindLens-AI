import Link from "next/link";
import Image from "next/image";

const patientLinks = {
  quickLinks: [
    { href: "/dashboard/patient", label: "Home" },
    { href: "/dashboard/patient/appointments", label: "My Appointments" },
    { href: "/dashboard/patient/profile", label: "My Profile" },
  ],
  col3: {
    title: "Take a Test",
    links: [
      { href: "/emotion-test", label: "AI Emotion Analysis" },
      { href: "/emotion-test", label: "Get Recommendations" },
    ],
  },
  col4: {
    title: "Book a Session",
    links: [
      { href: "/dashboard/patient#find-counselors", label: "Browse Counselors" },
      { href: "/emotion-test", label: "Get AI-Chatbot Guidance" },
    ],
  },
};

const counselorLinks = {
  quickLinks: [
    { href: "/dashboard/counselor", label: "Home" },
    { href: "/dashboard/counselor/appointments", label: "My Appointments" },
    { href: "/dashboard/counselor/profile", label: "My Profile" },
  ],
  col3: {
    title: "Manage",
    links: [
      { href: "/dashboard/counselor/availability", label: "Availability" },
      { href: "/dashboard/counselor/appointments", label: "Appointments" },
    ],
  },
  col4: {
    title: "Account",
    links: [
      { href: "/dashboard/counselor/profile", label: "View Profile" },
      { href: "/dashboard/counselor/profile/edit", label: "Edit Profile" },
    ],
  },
};

export function DashboardFooter({ role }: { role: string }) {
  const config = role === "COUNSELOR" ? counselorLinks : patientLinks;

  return (
    <footer className="bg-primary text-white py-12 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-8">
          <div>
            <Image
              src="/MindLens-AI_ Logo.svg"
              alt="MindLens AI"
              width={150}
              height={40}
              className="mb-3 brightness-0 invert"
              style={{ width: "auto", height: "auto" }}
            />
            <p className="text-white/90 text-sm">
              Your companion for mental wellness.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-base">Quick Links</h4>
            <ul className="space-y-3 text-sm text-white/90">
              {config.quickLinks.map((link) => (
                <li key={link.href}><Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-base">{config.col3.title}</h4>
            <ul className="space-y-3 text-sm text-white/90">
              {config.col3.links.map((link) => (
                <li key={link.label}><Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-base">{config.col4.title}</h4>
            <ul className="space-y-3 text-sm text-white/90">
              {config.col4.links.map((link) => (
                <li key={link.label}><Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/30 pt-6 text-center text-sm text-white/80">
          © 2025 MindLens-AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
