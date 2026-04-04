"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotifications } from "@/lib/notifications";

const NPR_TO_USD = Number(process.env.NPR_TO_USD_RATE ?? 148.70);

function roundTwo(n: number) {
  return Math.round(n * 100) / 100;
}

// step 1 of the payment flow: hold the slot and create a pending appointment + payment record
export async function createPendingBooking(
  slotId: string,
  gateway: "KHALTI" | "PAYPAL",
  medicalConcern?: string,
  emotionLogId?: string
): Promise<
  | { appointmentId: string; amountNpr: number; amountUsd: number }
  | { error: string }
> {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return { error: "Unauthorized" };
  }

  const trimmedConcern = medicalConcern?.trim() || undefined;
  if (trimmedConcern && trimmedConcern.length > 500) {
    return { error: "Medical concern is too long (max 500 characters)" };
  }

  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { email: true } } },
    });

    if (!patientProfile) return { error: "Patient profile not found" };

    // verify the emotion log belongs to this patient if provided
    let verifiedEmotionLogId: string | undefined;
    if (emotionLogId) {
      const emotionLog = await prisma.emotionLog.findUnique({
        where: { id: emotionLogId },
        select: { id: true, patientProfileId: true },
      });
      if (!emotionLog || emotionLog.patientProfileId !== patientProfile.id) {
        return { error: "Selected emotion report not found" };
      }
      verifiedEmotionLogId = emotionLog.id;
    }

    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: {
        counselor: {
          select: {
            userId: true,
            fullName: true,
            professionalTitle: true,
            hourlyRate: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!slot || slot.isBooked || slot.isBlocked) {
      return { error: "This slot is no longer available" };
    }

    // prevent double-booking with same counselor on the same day
    const slotDate = new Date(slot.startTime);
    const startOfDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientProfileId: patientProfile.id,
        counselorProfileId: slot.counselorProfileId,
        status: { notIn: ["CANCELLED"] },
        slot: { startTime: { gte: startOfDay }, endTime: { lt: endOfDay } },
      },
    });

    if (existingAppointment) {
      return { error: "You already have an appointment with this counselor on this day." };
    }

    // check if a previous cancelled appointment holds this slot (unique constraint reuse)
    const existingSlotAppt = await prisma.appointment.findUnique({ where: { slotId } });

    const amountNpr = Number(slot.counselor.hourlyRate);
    const amountUsd = roundTwo(amountNpr / NPR_TO_USD);

    let appointmentId = "";

    await prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      // reuse cancelled appointment row to avoid unique constraint violation on slotId
      let created: { id: string };
      if (existingSlotAppt?.status === "CANCELLED") {
        created = await tx.appointment.update({
          where: { id: existingSlotAppt.id },
          data: {
            patientProfileId: patientProfile.id,
            counselorProfileId: slot.counselorProfileId,
            status: "PAYMENT_PENDING",
            cancelledBy: null,
            meetingLink: null,
            patientNote: null,
            medicalConcern: trimmedConcern ?? null,
            attachedEmotionLogId: verifiedEmotionLogId ?? null,
            reminderSent: false,
            createdAt: new Date(),
          },
        });
      } else {
        created = await tx.appointment.create({
          data: {
            slotId,
            patientProfileId: patientProfile.id,
            counselorProfileId: slot.counselorProfileId,
            status: "PAYMENT_PENDING",
            medicalConcern: trimmedConcern,
            attachedEmotionLogId: verifiedEmotionLogId,
          },
        });
      }

      appointmentId = created.id;

      // upsert so that retrying after a cancelled payment resets the existing FAILED record
      // rather than hitting the unique constraint on appointmentId
      await tx.payment.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          gateway,
          status: "PENDING",
          amountNpr: slot.counselor.hourlyRate,
          amountUsd: gateway === "PAYPAL" ? amountUsd : null,
        },
        update: {
          gateway,
          status: "PENDING",
          amountNpr: slot.counselor.hourlyRate,
          amountUsd: gateway === "PAYPAL" ? amountUsd : null,
          gatewayPidx: null,
          gatewayOrderId: null,
          gatewayTxnId: null,
        },
      });
    });

    return { appointmentId, amountNpr, amountUsd };
  } catch {
    return { error: "Failed to initiate booking. Please try again." };
  }
}

// step 2 on success: move appointment to scheduled, generate meeting link, send emails + notifications
export async function finalizeSuccessfulBooking(
  appointmentId: string,
  gatewayTxnId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        slot: {
          include: {
            counselor: {
              select: {
                userId: true,
                fullName: true,
                professionalTitle: true,
                user: { select: { email: true } },
              },
            },
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            userId: true,
            user: { select: { email: true } },
          },
        },
        payment: true,
      },
    });

    if (!appointment) return { error: "Appointment not found" };

    // idempotency guard — only finalize a pending appointment once
    if (appointment.status !== "PAYMENT_PENDING") {
      return { error: "Appointment is not in a pending payment state" };
    }

    const { createInternalMeetingLink } = await import("@/lib/jitsi");
    const inAppMeetingUrl = createInternalMeetingLink(appointmentId);

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "SCHEDULED", meetingLink: inAppMeetingUrl },
      });
      await tx.payment.update({
        where: { appointmentId },
        data: { status: "COMPLETED", gatewayTxnId },
      });
    });

    // send emails + notifications non-blocking so the response is not delayed
    if (inAppMeetingUrl) {
      const { format } = await import("date-fns");
      const { bookingConfirmationEmail, counselorBookingNotificationEmail } = await import("@/lib/email-templates");
      const { sendEmail } = await import("@/lib/email");

      const dateStr = format(appointment.slot.startTime, "MMMM d, yyyy");
      const timeStr = format(appointment.slot.startTime, "h:mm a");

      // generate emotion report pdf if the patient attached one
      let pdfBuffer: Buffer | null = null;
      let pdfFilename = "";
      if (appointment.attachedEmotionLogId) {
        try {
          const { buildReportPayload } = await import("@/lib/emotion-report-payload");
          const { renderEmotionReportPdfBuffer } = await import("@/lib/emotion-report-render");
          const emotionLog = await prisma.emotionLog.findUnique({ where: { id: appointment.attachedEmotionLogId } });
          if (emotionLog) {
            const payload = buildReportPayload(emotionLog);
            if (payload) {
              pdfBuffer = Buffer.from(await renderEmotionReportPdfBuffer(payload));
              pdfFilename = `mindlens-emotion-report-${appointment.attachedEmotionLogId.slice(0, 8)}.pdf`;
            }
          }
        } catch (err) {
          console.error("Failed to generate emotion report PDF:", err);
        }
      }

      sendEmail({
        to: appointment.patient.user.email,
        subject: "Appointment Confirmed - MindLens AI",
        html: bookingConfirmationEmail({
          patientName: appointment.patient.fullName,
          counselorName: appointment.slot.counselor.fullName,
          counselorTitle: appointment.slot.counselor.professionalTitle || "Counselor",
          date: dateStr,
          time: timeStr,
          meetingLink: inAppMeetingUrl,
        }),
      }).catch(console.error);

      sendEmail({
        to: appointment.slot.counselor.user.email,
        subject: "New Appointment Booked - MindLens AI",
        html: counselorBookingNotificationEmail({
          counselorName: appointment.slot.counselor.fullName,
          patientName: appointment.patient.fullName,
          date: dateStr,
          time: timeStr,
          meetingLink: inAppMeetingUrl,
          medicalConcern: appointment.medicalConcern ?? undefined,
          emotionReportAttached: !!pdfBuffer,
        }),
        ...(pdfBuffer ? { attachments: [{ filename: pdfFilename, content: pdfBuffer }] } : {}),
      }).catch(console.error);

      createNotifications([
        {
          userId: appointment.patient.userId,
          type: "APPOINTMENT_BOOKED",
          title: "Appointment Confirmed",
          body: `Your session with ${appointment.slot.counselor.fullName} is set for ${dateStr} at ${timeStr}.`,
          data: { href: `/dashboard/patient/appointments/${appointmentId}` },
        },
        {
          userId: appointment.slot.counselor.userId,
          type: "APPOINTMENT_BOOKED",
          title: "New Appointment Booked",
          body: `${appointment.patient.fullName} booked a session with you for ${dateStr} at ${timeStr}.`,
          data: { href: `/dashboard/counselor/appointments/${appointmentId}` },
        },
      ]).catch(console.error);
    }

    revalidatePath("/dashboard/patient");
    revalidatePath("/dashboard/patient/appointments");
    return { success: true };
  } catch {
    return { error: "Failed to finalize booking. Please contact support." };
  }
}

// step 2 on failure: release the slot and mark payment as failed
export async function cancelPendingBooking(
  appointmentId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true, payment: true },
    });

    if (!appointment) return { error: "Appointment not found" };

    // guard against race condition: don't cancel an already-finalized appointment
    if (appointment.status !== "PAYMENT_PENDING") {
      return { error: "Already finalized" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED", cancelledBy: null },
      });
      if (appointment.payment) {
        await tx.payment.update({
          where: { appointmentId },
          data: { status: "FAILED" },
        });
      }
    });

    return { success: true };
  } catch {
    return { error: "Failed to cancel booking." };
  }
}
