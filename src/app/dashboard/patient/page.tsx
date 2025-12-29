"use client";

import { signOut } from "next-auth/react";

export default function PatientDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hi Patient!</h1>
      <p className="mb-4">This page is under development. Please check back later.</p>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-blue-600 hover:underline"
      >
        Log out
      </button>
    </div>
  );
}