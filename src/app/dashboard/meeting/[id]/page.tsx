import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VideoCall } from "@/components/shared/video-call";
import {
  createMeetingJwt,
  createMeetingRoomName,
  getJitsiAppId,
  getJitsiDomain,
} from "@/lib/jitsi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as "PATIENT" | "COUNSELOR";

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      slot: true,
      patient: {
        select: {
          userId: true,
          fullName: true,
          user: { select: { email: true } },
        },
      },
      counselor: {
        select: {
          userId: true,
          fullName: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!appointment || !appointment.meetingLink) {
    redirect(role === "PATIENT" ? "/dashboard/patient/appointments" : "/dashboard/counselor/appointments");
  }

  // Verify the user owns this appointment
  if (role === "PATIENT" && appointment.patient.userId !== session.user.id) {
    redirect("/dashboard/patient/appointments");
  }
  if (role === "COUNSELOR" && appointment.counselor.userId !== session.user.id) {
    redirect("/dashboard/counselor/appointments");
  }

  // Check if appointment is still valid (not cancelled/missed)
  if (appointment.status !== "SCHEDULED") {
    redirect(role === "PATIENT" ? "/dashboard/patient/appointments" : "/dashboard/counselor/appointments");
  }

  // Time gate to block access more than 30 minutes before start
  const now = new Date();
  const msUntilStart = appointment.slot.startTime.getTime() - now.getTime();
  const minutesUntilStart = msUntilStart / (1000 * 60);
  const isEnded = now >= appointment.slot.endTime;

  if (isEnded) {
    redirect(role === "PATIENT" ? "/dashboard/patient/appointments" : "/dashboard/counselor/appointments");
  }

  if (minutesUntilStart > 30) {
    const hours = Math.floor(minutesUntilStart / 60);
    const mins = Math.round(minutesUntilStart % 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border p-8 text-center space-y-5">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-3xl">🐦</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Hi Early Bird!</h1>
          <p className="text-gray-600 leading-relaxed">
            You still have <strong className="text-primary">{timeStr}</strong> before the appointment.
            You can join up to <strong>30 minutes</strong> before the scheduled time.
          </p>
          <a
            href={role === "PATIENT" ? "/dashboard/patient/appointments" : "/dashboard/counselor/appointments"}
            className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Appointments
          </a>
        </div>
      </div>
    );
  }

  const participant = role === "PATIENT" ? appointment.patient : appointment.counselor;
  const roomName = createMeetingRoomName(appointment.id);
  const jwt = await createMeetingJwt({
    roomName,
    moderator: role === "COUNSELOR",
    user: {
      id: session.user.id,
      name: participant.fullName || (role === "PATIENT" ? "Patient" : "Counselor"),
      email: participant.user.email,
    },
    expiresAt: new Date(appointment.slot.endTime.getTime() + 30 * 60 * 1000),
  });

  return (
    <VideoCall
      appId={getJitsiAppId()}
      domain={getJitsiDomain()}
      roomName={roomName}
      jwt={jwt}
      role={role}
    />
  );
}
