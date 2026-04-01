"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Ban, Clock, Mail } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const defaultSupportMailto = `mailto:support@mindlens.ai?subject=${encodeURIComponent(
  "MindLens AI — account support"
)}`;

function supportMailtoHref() {
  const addr = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  if (addr) {
    return `mailto:${addr}?subject=${encodeURIComponent("MindLens AI — account support")}`;
  }
  return defaultSupportMailto;
}

export interface AccountRestrictionAlertProps {
  isBanned: boolean;
  suspendedUntil: string | null;
}

function ContactSupportButton({ variant }: { variant: "ban" | "suspend" }) {
  const isBan = variant === "ban";
  return (
    <Link href={supportMailtoHref()} className="flex w-full justify-end">
      <Button
        size="sm"
        className={
          isBan
            ? "gap-1.5 border-0 bg-red-700 text-white hover:bg-red-800"
            : "gap-1.5 border-0 bg-amber-700 text-white hover:bg-amber-800"
        }
      >
        <Mail className="h-3.5 w-3.5" />
        Contact support
      </Button>
    </Link>
  );
}

/** Ban/suspend notice — same structure as CounselorVerificationAlerts (tinted alert + bottom-right action). */
export function AccountRestrictionAlert({ isBanned, suspendedUntil }: AccountRestrictionAlertProps) {
  if (isBanned) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <AlertTriangle className="h-4 w-4 !text-red-600" />
        <AlertTitle className="font-semibold text-red-800">Account Banned</AlertTitle>
        <AlertDescription className="space-y-3 text-red-700">
          <p>Your account has been permanently banned. Only your profile is accessible.</p>
          <ContactSupportButton variant="ban" />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-800">
      <Clock className="h-4 w-4 !text-amber-600" />
      <AlertTitle className="font-semibold text-amber-800">Account Suspended</AlertTitle>
      <AlertDescription className="space-y-3 text-amber-700">
        <p>
          Your account is suspended until {suspendedUntil ? formatDate(suspendedUntil) : "further notice"}. Only your
          profile is accessible.
        </p>
        <ContactSupportButton variant="suspend" />
      </AlertDescription>
    </Alert>
  );
}

interface AccountAccessGateProps {
  isBanned: boolean;
  isSuspended: boolean;
  suspendedUntil: string | null;
  banReason: string | null;
  suspendReason: string | null;
  profilePath: string;
  children: React.ReactNode;
}

/** White card below the alert — same structure as CounselorSchedulingLockedCard */
function RestrictedFeatureCard({
  isBanned,
  suspendedUntil,
  banReason,
  suspendReason,
}: {
  isBanned: boolean;
  suspendedUntil: string | null;
  banReason: string | null;
  suspendReason: string | null;
}) {
  return (
    <Card className="border-0 shadow-sm">
      {/* padding matches CounselorSchedulingLockedCard */}
      <CardContent className="space-y-3 py-20 text-center">
        <div className="mb-2 flex justify-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              isBanned ? "bg-red-50" : "bg-amber-50"
            }`}
          >
            {isBanned ? (
              <Ban className="h-7 w-7 text-red-600" strokeWidth={1.75} />
            ) : (
              <Clock className="h-7 w-7 text-amber-600" strokeWidth={1.75} />
            )}
          </div>
        </div>
        <p className={`text-lg font-semibold ${isBanned ? "text-red-700" : "text-amber-700"}`}>
          {isBanned ? "Your account has been banned" : "Your account is suspended"}
        </p>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-500">
          {isBanned
            ? banReason ??
              "Your account has been permanently banned from MindLens AI due to violations of our terms and conditions."
            : suspendedUntil
              ? `Your access is suspended until ${formatDate(suspendedUntil)}. ${suspendReason ?? ""}`
              : suspendReason ?? "Your account is temporarily suspended."}
        </p>
        {!isBanned && (
          <p className="mx-auto max-w-2xl text-xs text-gray-400">
            Access is restored automatically when the suspension period ends.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AccountAccessGate({
  isBanned,
  isSuspended,
  suspendedUntil,
  banReason,
  suspendReason,
  profilePath,
  children,
}: AccountAccessGateProps) {
  const pathname = usePathname();

  const isRestricted = isBanned || isSuspended;
  const isProfilePage = pathname === profilePath || pathname.startsWith(`${profilePath}/`);

  return (
    <div>
      {isRestricted && !isProfilePage ? (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 pb-12 pt-20 lg:px-8">
          {/* same content width as unverified counselor (verification alert + scheduling locked card) */}
          <div className="mx-auto max-w-4xl space-y-6">
            <AccountRestrictionAlert isBanned={isBanned} suspendedUntil={suspendedUntil} />

            <RestrictedFeatureCard
              isBanned={isBanned}
              suspendedUntil={suspendedUntil}
              banReason={banReason}
              suspendReason={suspendReason}
            />
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
