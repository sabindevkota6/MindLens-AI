import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelPendingBooking } from "@/lib/actions/payment";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { appointmentId: string };
  const { appointmentId } = body;

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
  }

  // verify the appointment belongs to the requesting patient
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { select: { userId: true } } },
  });

  if (!appointment || appointment.patient.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await cancelPendingBooking(appointmentId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
