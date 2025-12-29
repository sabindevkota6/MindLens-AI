import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// inter font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MindLens-AI | Mental Health Triage & Support",
  description: "AI-powered emotional analysis and counselor matching platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}