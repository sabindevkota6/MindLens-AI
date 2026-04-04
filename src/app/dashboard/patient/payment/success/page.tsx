import Link from "next/link";
import { CheckCircle2, CalendarDays, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ appointmentId?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const { appointmentId } = await searchParams;

  // fetch counselor name for the confirmation message
  let counselorName = "your counselor";
  let dateStr = "";
  if (appointmentId) {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          slot: {
            select: {
              startTime: true,
              counselor: { select: { fullName: true } },
            },
          },
        },
      });
      if (appt?.slot) {
        counselorName = appt.slot.counselor.fullName;
        dateStr = new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(appt.slot.startTime));
      }
    } catch {
      // not critical — fallback text is shown
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] p-8 text-center">

        {/* success icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-1">
          Your session with <span className="font-semibold text-gray-800">{counselorName}</span> has been confirmed.
        </p>
        {dateStr && (
          <p className="text-sm text-gray-500 mb-1">
            <CalendarDays className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
            {dateStr}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2 mb-8">
          A confirmation email with your meeting link has been sent to your inbox.
        </p>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full gap-2">
            <Link href="/dashboard/patient/appointments">
              View My Appointments
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full text-gray-500">
            <Link href="/dashboard/patient">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
