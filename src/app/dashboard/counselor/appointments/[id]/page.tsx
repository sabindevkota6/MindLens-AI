import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAppointmentDetail } from "@/lib/actions/appointment";
import { getCounselorProfile } from "@/lib/actions/counselor";
import {
  counselorHasVerificationDocuments,
  isCounselorProfileComplete,
  isCounselorVerified,
} from "@/lib/counselor-guards";
import {
  CounselorSchedulingLockedCard,
  CounselorVerificationAlerts,
} from "@/components/counselor/verification-scheduling-gate";
import { AppointmentDetailView } from "@/components/shared/appointment-detail-view";
import type { AppointmentDetail } from "@/components/shared/appointment-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CounselorAppointmentDetailPage({ params }: PageProps) {
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
          <div className="max-w-5xl mx-auto">
            <Link
              href="/dashboard/counselor/appointments"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Appointments
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Appointment Details
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Scheduling access is restricted until verification is complete.
            </p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 -mt-4 pb-12 space-y-6">
          <CounselorVerificationAlerts
            verificationStatus={verificationStatus}
            hasVerificationDoc={hasVerificationDoc}
          />
          <CounselorSchedulingLockedCard />
        </div>
      </div>
    );
  }

  const { id } = await params;
  const appointment = await getAppointmentDetail(id);

  if (!appointment) {
    redirect("/dashboard/counselor/appointments");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/dashboard/counselor/appointments"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Appointments
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Appointment Details
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Session with {appointment.patient.fullName}
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 lg:px-8 -mt-4 pb-12 relative z-10">
        <AppointmentDetailView
          appointment={appointment as unknown as AppointmentDetail}
          role="COUNSELOR"
        />
      </div>
    </div>
  );
}
