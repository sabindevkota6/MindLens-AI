import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile, getAllSpecialties } from "@/lib/actions/counselor";
import Image from "next/image";
import CounselorOnboardingForm from "@/components/counselor/onboarding-form";

export default async function CounselorOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [profile, specialties] = await Promise.all([
    getCounselorProfile(),
    getAllSpecialties(),
  ]);
  const isProfileComplete =
    profile?.isOnboarded &&
    profile?.professionalTitle &&
    profile?.bio &&
    profile?.experienceYears != null &&
    profile?.hourlyRate != null &&
    profile?.dateOfBirth;
  if (isProfileComplete) redirect("/dashboard/counselor");

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
                width={220}
                height={60}
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Complete Your Professional Profile
            </h1>
            <p className="text-gray-500 text-sm">
              We need a few more details to set up your counselor profile and
              get you started.
            </p>
          </div>

          <CounselorOnboardingForm email={session.user.email || ""} specialties={specialties} />
        </div>
      </div>
    </div>
  );
}
