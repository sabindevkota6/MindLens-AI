"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { User, UserCheck, Stethoscope, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setupOAuthUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OAuthSetupFormProps {
  defaultName: string;
}

export function OAuthSetupForm({ defaultName }: OAuthSetupFormProps) {
  const router = useRouter();
  const { update } = useSession();

  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState<"PATIENT" | "COUNSELOR" | null>(null);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!role) {
      setError("Please select a role to continue.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setError(undefined);

    startTransition(async () => {
      const result = await setupOAuthUser(role, name);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      // tell nextauth to clear the needsRoleSetup flag and update role in the token
      await update({ needsRoleSetup: false, role });

      // send to the correct onboarding flow
      router.push(`/dashboard/${role.toLowerCase()}/onboarding`);
    });
  };

  return (
    <div className="w-full max-w-[520px] bg-white rounded-3xl overflow-hidden shadow-[0_25px_80px_-12px_rgba(0,0,0,0.22)]">

      {/* header */}
      <div className="bg-gradient-to-r from-[#0d9488] to-[#115e59] px-8 pt-8 pb-6 text-white text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-[#0f766e]/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/10">
            <Image
              src="/MindLens-AI_ Logo.svg"
              alt="MindLens-AI Logo"
              width={130}
              height={38}
              className="h-8 w-auto"
              priority
            />
          </div>
        </div>
        <h1 className="text-xl font-bold mb-1">Almost there!</h1>
        <p className="text-white/70 text-sm">
          One last step — tell us who you are so we can set up your account.
        </p>
      </div>

      {/* form body */}
      <div className="px-8 py-7 space-y-6">

        {/* name field */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-600">Your Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="pl-10 h-10 border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* role selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">I am joining as a...</label>
          <div className="grid grid-cols-2 gap-3">

            {/* patient card */}
            <button
              type="button"
              onClick={() => setRole("PATIENT")}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                role === "PATIENT"
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {role === "PATIENT" && (
                <UserCheck className="absolute top-2.5 right-2.5 w-4 h-4 text-teal-500" />
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                role === "PATIENT" ? "bg-teal-100" : "bg-gray-100"
              )}>
                <User className={cn("w-5 h-5", role === "PATIENT" ? "text-teal-600" : "text-gray-400")} />
              </div>
              <div>
                <p className={cn("text-sm font-semibold", role === "PATIENT" ? "text-teal-700" : "text-gray-700")}>
                  Patient
                </p>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Seek support &amp; connect with counselors
                </p>
              </div>
            </button>

            {/* counselor card */}
            <button
              type="button"
              onClick={() => setRole("COUNSELOR")}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                role === "COUNSELOR"
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {role === "COUNSELOR" && (
                <UserCheck className="absolute top-2.5 right-2.5 w-4 h-4 text-teal-500" />
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                role === "COUNSELOR" ? "bg-teal-100" : "bg-gray-100"
              )}>
                <Stethoscope className={cn("w-5 h-5", role === "COUNSELOR" ? "text-teal-600" : "text-gray-400")} />
              </div>
              <div>
                <p className={cn("text-sm font-semibold", role === "COUNSELOR" ? "text-teal-700" : "text-gray-700")}>
                  Counselor
                </p>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Provide guidance &amp; professional support
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* submit */}
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full h-10 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold rounded-xl transition-all duration-200"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up your account...
            </span>
          ) : (
            "Continue to MindLens"
          )}
        </Button>

        <p className="text-center text-xs text-gray-400">
          You can update your name and profile details later from your settings.
        </p>
      </div>
    </div>
  );
}
