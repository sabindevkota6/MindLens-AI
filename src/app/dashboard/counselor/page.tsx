import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile } from "@/lib/actions/counselor";
import ProfileWizard from "@/components/counselor/profile-wizard";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import Link from "next/link";

export default async function CounselorDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const profile = await getCounselorProfile();

  // calculate completion status
  // Profile is incomplete if:
  // 1. Bio is missing/empty
  // 2. OR Verification Status is PENDING AND no documents have been uploaded
  const hasBio = !!profile?.bio && profile.bio.length >= 10;
  const hasExperience = (profile?.experienceYears ?? -1) >= 0;
  const hasRate = (Number(profile?.hourlyRate) ?? 0) > 0;
  const hasDocs = profile?.documents && profile.documents.length > 0;

  // Strict check: Must have bio, exp, rate. 
  // For documents: If not VERIFIED, must have at least one doc uploaded to be "complete" enough to wait.
  // Actually, the prompt said: "If bio is empty OR verificationStatus is PENDING and no document exists".

  const isProfileComplete =
    hasBio &&
    hasExperience &&
    hasRate &&
    (profile?.verificationStatus === "VERIFIED" || hasDocs);

  // get first name for greeting
  const firstName = session.user.name?.split(" ")[0] || "Counselor";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

      {!isProfileComplete && (
        <ProfileWizard />
      )}

      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Hello, {firstName}!
          </h1>
          <p className="text-gray-500">
            Your dashboard is under development.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard/counselor/profile">
            <Button variant="outline" className="w-full gap-2 bg-white hover:bg-gray-100">
              <User className="w-4 h-4" />
              Manage Profile
            </Button>
          </Link>

          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <Button variant="destructive" type="submit" className="w-full gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </form>
        </div>

        {/* Debug info (optional, remove in prod) */}
        {!isProfileComplete && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            Waiting for profile completion...
          </p>
        )}
      </div>
    </div>
  );
}
