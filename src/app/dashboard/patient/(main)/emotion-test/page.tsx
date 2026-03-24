import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EmotionTestContent } from "@/components/patient/emotion-test-content";
import { getPatientProfile } from "@/lib/actions/patient";

// server component handles auth, then hands off to the client wrapper
// which manages the analysis results state and rendering logic
export default async function EmotionTestPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const profile = await getPatientProfile();
  const isProfileComplete = profile?.isOnboarded && profile?.dateOfBirth;
  if (!isProfileComplete) redirect("/dashboard/patient/onboarding");

  return <EmotionTestContent />;
}
