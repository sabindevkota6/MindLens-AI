import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAppointments } from "@/lib/actions/appointment";
import { getCounselorProfile } from "@/lib/actions/counselor";
import { AppointmentsList } from "@/components/shared/appointments-list";
import {
  counselorHasVerificationDocuments,
  isCounselorProfileComplete,
  isCounselorVerified,
} from "@/lib/counselor-guards";
import {
  CounselorSchedulingLockedCard,
  CounselorVerificationAlerts,
} from "@/components/counselor/verification-scheduling-gate";
import { Calendar } from "lucide-react";

export default async function CounselorAppointmentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COUNSELOR") redirect("/login");

  const profile = await getCounselorProfile();
  if (!profile || !isCounselorProfileComplete(profile)) {
    redirect("/dashboard/counselor/onboarding");
  }

  const verificationStatus = profile.verificationStatus;
  const isVerified = isCounselorVerified(profile);
  const hasVerificationDoc = counselorHasVerificationDocuments(profile);

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  My Appointments
                </h1>
                <p className="text-white/70 text-sm mt-0.5">
                  Manage your counseling sessions
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-4 pb-12 space-y-6">
          <CounselorVerificationAlerts
            verificationStatus={verificationStatus}
            hasVerificationDoc={hasVerificationDoc}
          />
          <CounselorSchedulingLockedCard />
        </div>
      </div>
    );
  }

  const { appointments, totalPages } = await getAppointments("upcoming", 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                My Appointments
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                Manage your counseling sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-4 pb-12">
        <AppointmentsList
          role="COUNSELOR"
          initialAppointments={appointments}
          initialTotalPages={totalPages}
          initialCategory="upcoming"
        />
      </div>
    </div>
  );
}
