import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAppointments } from "@/lib/actions/appointment";
import { getPatientProfile } from "@/lib/actions/patient";
import { AppointmentsList } from "@/components/shared/appointments-list";
import { Calendar } from "lucide-react";

export default async function PatientAppointmentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") redirect("/login");

  const profile = await getPatientProfile();
  const isProfileComplete = profile?.isOnboarded && profile?.dateOfBirth;
  if (!isProfileComplete) redirect("/dashboard/patient/onboarding");

  const { appointments, totalPages } = await getAppointments("upcoming", 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                Manage your therapy sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-4 pb-12">
        <AppointmentsList
          role="PATIENT"
          initialAppointments={appointments}
          initialTotalPages={totalPages}
          initialCategory="upcoming"
        />
      </div>
    </div>
  );
}
