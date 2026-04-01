"use client";

import { usePathname } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, Clock, Ban } from "lucide-react";

interface AccountAccessGateProps {
  isBanned: boolean;
  isSuspended: boolean;
  suspendedUntil: string | null;
  banReason: string | null;
  suspendReason: string | null;
  // profile path differs by role e.g. /dashboard/patient/profile
  profilePath: string;
  children: React.ReactNode;
}

// formats ISO date to readable string
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// the locked placeholder shown on all non-profile pages when user is banned/suspended
function RestrictedContentCard({ isBanned, suspendedUntil, banReason, suspendReason }: {
  isBanned: boolean;
  suspendedUntil: string | null;
  banReason: string | null;
  suspendReason: string | null;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="py-20 text-center space-y-4">
        <div className="flex justify-center mb-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isBanned ? "bg-red-50" : "bg-amber-50"}`}>
            {isBanned
              ? <Ban className="w-8 h-8 text-red-400" />
              : <Clock className="w-8 h-8 text-amber-400" />
            }
          </div>
        </div>
        <p className={`text-lg font-semibold ${isBanned ? "text-red-700" : "text-amber-700"}`}>
          {isBanned ? "Your account has been banned" : "Your account is suspended"}
        </p>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          {isBanned
            ? (banReason ?? "Your account has been permanently banned from MindLens AI due to violations of our terms and conditions.")
            : suspendedUntil
              ? `Your access is suspended until ${formatDate(suspendedUntil)}. ${suspendReason ?? ""}`
              : "Your account is temporarily suspended."
          }
        </p>
        {!isBanned && (
          <p className="text-xs text-gray-400">Access is restored automatically when the suspension period ends.</p>
        )}
      </CardContent>
    </Card>
  );
}

// wraps the page content — allows profile access, blocks everything else
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

  // profile page is always accessible
  const isProfilePage = pathname === profilePath || pathname.startsWith(profilePath);

  return (
    <div>
      {isRestricted && (
        <div className="sticky top-16 z-40 px-4 py-2">
          <Alert className={`border-0 rounded-none ${isBanned ? "bg-red-50 border-b border-red-100" : "bg-amber-50 border-b border-amber-100"}`}>
            <ShieldX className={`h-4 w-4 ${isBanned ? "!text-red-500" : "!text-amber-500"}`} />
            <AlertTitle className={`font-semibold ${isBanned ? "text-red-800" : "text-amber-800"}`}>
              {isBanned ? "Account Banned" : "Account Suspended"}
            </AlertTitle>
            <AlertDescription className={isBanned ? "text-red-700" : "text-amber-700"}>
              {isBanned
                ? "Your account has been permanently banned. Only your profile is accessible."
                : `Your account is suspended until ${suspendedUntil ? formatDate(suspendedUntil) : "further notice"}. Only your profile is accessible.`
              }
            </AlertDescription>
          </Alert>
        </div>
      )}

      {isRestricted && !isProfilePage ? (
        <div className="px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <RestrictedContentCard
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
