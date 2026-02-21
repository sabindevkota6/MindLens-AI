import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPatientProfile } from "@/lib/actions/patient";
import Image from "next/image";
import PatientOnboardingForm from "@/components/patient/onboarding-form";

export default async function PatientOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getPatientProfile();
  const isProfileComplete = profile?.isOnboarded && profile?.dateOfBirth;
  if (isProfileComplete) redirect("/dashboard/patient");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Image
                src="/MindLens-AI_ Logo.svg"
                alt="MindLens AI"
                width={180}
                height={50}
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Complete Your Profile
            </h1>
            <p className="text-gray-500 text-sm">
              We need a few more details to personalise your experience.
            </p>
          </div>

          <PatientOnboardingForm email={session.user.email || ""} />
        </div>
      </div>
    </div>
  );
}
