import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPatientProfile } from "@/lib/actions/patient";
import EditPatientProfileForm from "@/components/patient/edit-profile-form";
import { AppNavbar } from "@/components/shared/navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditPatientProfilePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const profile = await getPatientProfile();

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Profile not found. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      <div className="bg-primary pt-20 pb-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link
            href="/dashboard/patient/profile"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
            <p className="text-white/70 text-sm mt-1">Update your personal information.</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <EditPatientProfileForm
            initialData={profile}
            email={profile.user.email}
          />
        </div>
      </div>
    </div>
  );
}
