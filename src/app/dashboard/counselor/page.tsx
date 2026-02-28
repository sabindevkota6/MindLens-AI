import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile } from "@/lib/actions/counselor";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import Link from "next/link";

export default async function CounselorDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getCounselorProfile();
  const isProfileComplete =
    profile?.isOnboarded &&
    profile?.professionalTitle &&
    profile?.bio &&
    profile?.experienceYears != null &&
    profile?.hourlyRate != null &&
    profile?.dateOfBirth;
  if (!isProfileComplete) redirect("/dashboard/counselor/onboarding");

  const firstName = session.user.name?.split(" ")[0] || "Counselor";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-24 flex flex-col items-center justify-center p-4">
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
        </div>
      </div>
    </div>
  );
}
