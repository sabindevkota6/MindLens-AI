import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EmotionTestContent } from "@/components/patient/emotion-test-content";

// server component handles auth, then hands off to the client wrapper
// which manages the analysis results state and rendering logic
export default async function EmotionTestPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  return <EmotionTestContent />;
}
