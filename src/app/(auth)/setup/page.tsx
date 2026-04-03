import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OAuthSetupForm } from "@/components/auth/oauth-setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const session = await auth();

  // if the user isn't flagged for setup, send them home
  if (!session?.user?.needsRoleSetup) {
    redirect("/dashboard/patient");
  }

  const defaultName = session.user.name ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <OAuthSetupForm defaultName={defaultName} />
    </div>
  );
}
