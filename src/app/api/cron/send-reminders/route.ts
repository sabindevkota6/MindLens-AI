import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { appointmentReminderEmail } from "@/lib/email-templates";
import { format } from "date-fns";

// how far ahead to look for upcoming appointments (in minutes)
const REMINDER_WINDOW_MINUTES = 30;

// this route is meant to be called by a cron job every ~5 minutes
// it finds scheduled appointments starting within 30 minutes that
// haven't been reminded yet, sends emails to both parties, and
// marks them as reminded
export async function GET(request: Request) {
    // optional: protect with a secret so only your cron service can call it
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);

        // find appointments starting within the next 30 minutes that haven't been reminded
        const appointments = await prisma.appointment.findMany({
            where: {
                status: "SCHEDULED",
                reminderSent: false,
                slot: {
                    startTime: {
                        gt: now,
                        lte: windowEnd,
                    },
                },
            },
            include: {
                slot: true,
                patient: {
                    select: {
                        fullName: true,
                        user: { select: { email: true } },
                    },
                },
                counselor: {
                    select: {
                        fullName: true,
                        user: { select: { email: true } },
                    },
                },
            },
        });

        if (appointments.length === 0) {
            return NextResponse.json({ message: "No reminders to send", sent: 0 });
        }

        let sentCount = 0;

        for (const appt of appointments) {
            const start = appt.slot.startTime;
            const end = appt.slot.endTime;
            const dateStr = format(start, "EEEE, MMMM d, yyyy");
            const timeStr = `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
            const meetingLink = appt.meetingLink || "";

            // send reminder to patient
            const patientEmail = appointmentReminderEmail({
                recipientName: appt.patient.fullName,
                otherPartyName: appt.counselor.fullName,
                otherPartyRole: "Counselor",
                date: dateStr,
                time: timeStr,
                meetingLink,
            });

            // send reminder to counselor
            const counselorEmail = appointmentReminderEmail({
                recipientName: appt.counselor.fullName,
                otherPartyName: appt.patient.fullName,
                otherPartyRole: "Patient",
                date: dateStr,
                time: timeStr,
                meetingLink,
            });

            // send both emails in parallel
            const [patientResult, counselorResult] = await Promise.all([
                sendEmail({
                    to: appt.patient.user.email,
                    subject: "Reminder: Your appointment starts in 30 minutes",
                    html: patientEmail,
                }),
                sendEmail({
                    to: appt.counselor.user.email,
                    subject: "Reminder: Your appointment starts in 30 minutes",
                    html: counselorEmail,
                }),
            ]);

            // mark as reminded regardless of email delivery to prevent duplicate sends
            await prisma.appointment.update({
                where: { id: appt.id },
                data: { reminderSent: true },
            });

            if (!patientResult.error && !counselorResult.error) {
                sentCount++;
            } else {
                console.error(`Reminder partial failure for appointment ${appt.id}:`, {
                    patient: patientResult.error,
                    counselor: counselorResult.error,
                });
            }
        }

        return NextResponse.json({
            message: `Sent reminders for ${sentCount} appointment(s)`,
            sent: sentCount,
            total: appointments.length,
        });
    } catch (error) {
        console.error("Cron send-reminders error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
