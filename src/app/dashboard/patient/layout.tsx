import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { resolveUserAccountStatus } from "@/lib/user-enforcement";
import { AccountAccessGate } from "@/components/shared/account-access-gate";

// fetches account status and lazily lifts expired suspensions before rendering any patient page
export default async function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const status = await resolveUserAccountStatus(session.user.id);

  if (!status) redirect("/login");

  return (
    <AccountAccessGate
      isBanned={status.isBanned}
      isSuspended={status.isSuspended}
      suspendedUntil={status.suspendedUntil ? status.suspendedUntil.toISOString() : null}
      banReason={status.banReason ?? null}
      suspendReason={status.suspendReason ?? null}
      profilePath="/dashboard/patient/profile"
    >
      {children}
    </AccountAccessGate>
  );
}
