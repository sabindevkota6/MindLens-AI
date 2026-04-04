import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile, getAllSpecialties } from "@/lib/actions/counselor";
import {
  counselorHasVerificationDocuments,
  isCounselorProfileComplete,
} from "@/lib/counselor-guards";
import Image from "next/image";
import CounselorOnboardingForm from "@/components/counselor/onboarding-form";

interface PageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function CounselorOnboardingPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COUNSELOR") redirect("/login");

  const { step: stepParam } = await searchParams;
  const wantsStep3 = stepParam === "3";

  const [profile, specialties] = await Promise.all([
    getCounselorProfile(),
    getAllSpecialties(),
  ]);
  const isProfileComplete = profile ? isCounselorProfileComplete(profile) : false;

  const hasVerificationDoc = profile
    ? counselorHasVerificationDocuments(profile)
    : false;
  /** First-time upload: pending, no file yet */
  const canReturnForVerificationUpload = Boolean(
    wantsStep3 &&
      isProfileComplete &&
      !hasVerificationDoc &&
      profile?.verificationStatus === "PENDING"
  );
  /** Replace existing submission (pending review or after rejection) */
  const canChangeVerificationDocument = Boolean(
    wantsStep3 &&
      isProfileComplete &&
      hasVerificationDoc &&
      (profile?.verificationStatus === "PENDING" ||
        profile?.verificationStatus === "REJECTED")
  );

  if (
    isProfileComplete &&
    wantsStep3 &&
    hasVerificationDoc &&
    profile?.verificationStatus === "VERIFIED"
  ) {
    redirect("/dashboard/counselor");
  }

  if (
    isProfileComplete &&
    !(canReturnForVerificationUpload || canChangeVerificationDocument)
  ) {
    redirect("/dashboard/counselor");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 space-y-6">
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
              {canChangeVerificationDocument
                ? "Change verification document"
                : canReturnForVerificationUpload
                  ? "Upload verification document"
                  : "Complete Your Professional Profile"}
            </h1>
            <p className="text-gray-500 text-sm">
              {canChangeVerificationDocument
                ? "Upload a new license or certificate to replace your current submission. Review status will remain pending until an administrator approves."
                : canReturnForVerificationUpload
                  ? "Submit a license or certificate so our team can verify your account. You’ll appear in the patient directory after approval."
                  : "We need a few more details to set up your counselor profile and get you started."}
            </p>
          </div>

          <CounselorOnboardingForm
            email={session.user.email || ""}
            specialties={specialties}
            initialStep={
              canReturnForVerificationUpload || canChangeVerificationDocument ? 3 : 1
            }
            verificationOnly={
              canReturnForVerificationUpload || canChangeVerificationDocument
            }
            replaceExistingDocument={canChangeVerificationDocument}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
