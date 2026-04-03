"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { cancellationEmail, appointmentAdjustedEmail } from "@/lib/email-templates";
import { checkPatientReportEnforcement, checkCounselorRatingEnforcement } from "@/lib/user-enforcement";
import { format } from "date-fns";

// ─── Constants ───
const CANCEL_CUTOFF_HOURS = 4;
const ADJUST_CUTOFF_HOURS = 2;
const MISSED_GRACE_MINUTES = 5;
const PAGE_SIZE = 6;

// ─── Helper: Resolve missed appointments (lazy evaluation) ───
async function resolveMissedAppointments(profileId: string, role: "PATIENT" | "COUNSELOR") {
    const now = new Date();
    const graceThreshold = new Date(now.getTime() - MISSED_GRACE_MINUTES * 60 * 1000);

    const whereClause = role === "PATIENT"
        ? { patientProfileId: profileId }
        : { counselorProfileId: profileId };

    await prisma.appointment.updateMany({
        where: {
            ...whereClause,
            status: "SCHEDULED",
            slot: {
                endTime: { lt: graceThreshold },
            },
        },
        data: { status: "MISSED" },
    });
}

// ─── Get appointments (paginated, categorized) ───
export const getAppointments = async (
    category: "upcoming" | "ongoing" | "completed" | "missed" | "cancelled",
    page: number = 1
) => {
    const session = await auth();
    if (!session?.user) return { appointments: [], totalPages: 0 };

    const role = session.user.role as "PATIENT" | "COUNSELOR";
    const now = new Date();

    // Get the profile ID
    let profileId: string | null = null;
    if (role === "PATIENT") {
        const profile = await prisma.patientProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });
        profileId = profile?.id ?? null;
    } else if (role === "COUNSELOR") {
        const profile = await prisma.counselorProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });
        profileId = profile?.id ?? null;
    }

    if (!profileId) return { appointments: [], totalPages: 0 };

    // Lazy resolve missed appointments before fetching
    await resolveMissedAppointments(profileId, role);

    const profileFilter = role === "PATIENT"
        ? { patientProfileId: profileId }
        : { counselorProfileId: profileId };

    // build status/time filter based on category
    let statusFilter: Record<string, unknown>;
    // grace threshold matches the missed detection window
    const graceEnd = new Date(now.getTime() - MISSED_GRACE_MINUTES * 60 * 1000);

    if (category === "ongoing") {
        // in session or within the grace period after end time (before marked missed)
        statusFilter = {
            status: "SCHEDULED",
            slot: { startTime: { lte: now }, endTime: { gt: graceEnd } },
        };
    } else if (category === "upcoming") {
        // scheduled but not yet started
        statusFilter = {
            status: "SCHEDULED",
            slot: { startTime: { gt: now } },
        };
    } else if (category === "completed") {
        statusFilter = { status: "COMPLETED" };
    } else if (category === "cancelled") {
        statusFilter = { status: "CANCELLED" };
    } else {
        statusFilter = { status: "MISSED" };
    }

    const [appointments, totalCount] = await Promise.all([
        prisma.appointment.findMany({
            where: { ...profileFilter, ...statusFilter },
            include: {
                slot: true,
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        user: { select: { email: true } },
                    },
                },
                counselor: {
                    select: {
                        id: true,
                        fullName: true,
                        professionalTitle: true,
                        user: { select: { email: true } },
                    },
                },
                review: { select: { id: true, rating: true } },
            },
            orderBy: { slot: { startTime: category === "upcoming" || category === "ongoing" ? "asc" : "desc" } },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.appointment.count({
            where: { ...profileFilter, ...statusFilter },
        }),
    ]);

    return {
        appointments: appointments.map((a) => ({
            id: a.id,
            status: a.status,
            meetingLink: a.meetingLink,
            patientNote: a.patientNote,
            cancelledBy: a.cancelledBy,
            createdAt: a.createdAt,
            slotStart: a.slot.startTime,
            slotEnd: a.slot.endTime,
            patient: { id: a.patient.id, fullName: a.patient.fullName, email: a.patient.user.email },
            counselor: { id: a.counselor.id, fullName: a.counselor.fullName, professionalTitle: a.counselor.professionalTitle, email: a.counselor.user.email },
            hasReview: !!a.review,
            reviewRating: a.review?.rating ?? null,
        })),
        totalPages: Math.ceil(totalCount / PAGE_SIZE),
    };
};

// ─── Get single appointment detail ───
export const getAppointmentDetail = async (appointmentId: string) => {
    const session = await auth();
    if (!session?.user) return null;

    const role = session.user.role as "PATIENT" | "COUNSELOR";

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            slot: true,
            patient: {
                select: {
                    id: true,
                    fullName: true,
                    userId: true,
                    bio: true,
                    dateOfBirth: true,
                    user: { select: { email: true, createdAt: true, image: true } },
                },
            },
            counselor: {
                select: {
                    id: true,
                    fullName: true,
                    professionalTitle: true,
                    userId: true,
                    bio: true,
                    experienceYears: true,
                    hourlyRate: true,
                    user: { select: { email: true, createdAt: true, image: true } },
                    specialties: {
                        include: { specialty: true },
                    },
                },
            },
            review: true,
            reports: {
                select: { id: true },
            },
        },
    });

    if (!appointment) return null;

    // Verify the user owns this appointment
    if (role === "PATIENT" && appointment.patient.userId !== session.user.id) return null;
    if (role === "COUNSELOR" && appointment.counselor.userId !== session.user.id) return null;

    // Lazy resolve missed if needed
    const now = new Date();
    const graceThreshold = new Date(now.getTime() - MISSED_GRACE_MINUTES * 60 * 1000);
    if (appointment.status === "SCHEDULED" && appointment.slot.endTime < graceThreshold) {
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "MISSED" },
        });
        appointment.status = "MISSED";
    }

    // Fetch counselor's review stats in parallel
    const [reviewStats, completedCount] = await Promise.all([
        prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
            where: { appointment: { counselorProfileId: appointment.counselorProfileId } },
        }),
        prisma.appointment.count({
            where: { counselorProfileId: appointment.counselorProfileId, status: "COMPLETED" },
        }),
    ]);

    const avgRating = reviewStats._avg.rating
        ? Math.round(reviewStats._avg.rating * 10) / 10
        : 0;

    const slotStart = appointment.slot.startTime;
    const hoursUntilStart = (slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
        id: appointment.id,
        status: appointment.status,
        meetingLink: appointment.meetingLink,
        patientNote: appointment.patientNote,
        cancelledBy: appointment.cancelledBy,
        createdAt: appointment.createdAt,
        slotStart: appointment.slot.startTime,
        slotEnd: appointment.slot.endTime,
        patient: {
            id: appointment.patient.id,
            fullName: appointment.patient.fullName,
            email: appointment.patient.user.email,
            image: appointment.patient.user.image ?? null,
            bio: appointment.patient.bio,
            dateOfBirth: appointment.patient.dateOfBirth,
            memberSince: appointment.patient.user.createdAt,
        },
        counselor: {
            id: appointment.counselor.id,
            fullName: appointment.counselor.fullName,
            professionalTitle: appointment.counselor.professionalTitle,
            email: appointment.counselor.user.email,
            image: appointment.counselor.user.image ?? null,
            bio: appointment.counselor.bio,
            experienceYears: appointment.counselor.experienceYears,
            hourlyRate: Number(appointment.counselor.hourlyRate),
            specialties: appointment.counselor.specialties.map((s) => s.specialty.name),
            avgRating,
            totalReviews: reviewStats._count.id,
            totalAppointments: completedCount,
            memberSince: appointment.counselor.user.createdAt,
        },
        review: appointment.review,
        hasReport: appointment.reports.length > 0,
        canCancel: appointment.status === "SCHEDULED" && hoursUntilStart >= CANCEL_CUTOFF_HOURS,
        canAdjust: role === "COUNSELOR" && appointment.status === "SCHEDULED" && hoursUntilStart >= ADJUST_CUTOFF_HOURS,
        canMarkComplete: role === "COUNSELOR" && appointment.status === "SCHEDULED" && now >= appointment.slot.endTime,
        canReview: role === "PATIENT" && appointment.status === "COMPLETED" && !appointment.review,
        canReport: role === "COUNSELOR" && appointment.status !== "CANCELLED",
        canAddNote: role === "PATIENT" && appointment.status === "SCHEDULED" && slotStart > now,
    };
};

// ─── Cancel appointment ───
export const cancelAppointment = async (appointmentId: string) => {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const role = session.user.role as "PATIENT" | "COUNSELOR";

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            slot: true,
            patient: {
                select: {
                    fullName: true,
                    userId: true,
                    user: { select: { email: true } },
                },
            },
            counselor: {
                select: {
                    fullName: true,
                    professionalTitle: true,
                    userId: true,
                    user: { select: { email: true } },
                },
            },
        },
    });

    if (!appointment) return { error: "Appointment not found" };

    // Verify ownership
    if (role === "PATIENT" && appointment.patient.userId !== session.user.id) return { error: "Unauthorized" };
    if (role === "COUNSELOR" && appointment.counselor.userId !== session.user.id) return { error: "Unauthorized" };

    if (appointment.status !== "SCHEDULED") {
        return { error: "Only scheduled appointments can be cancelled" };
    }

    const now = new Date();
    const hoursUntilStart = (appointment.slot.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < CANCEL_CUTOFF_HOURS) {
        return { error: `Appointments can only be cancelled at least ${CANCEL_CUTOFF_HOURS} hours before the scheduled time` };
    }

    await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
            where: { id: appointmentId },
            data: { status: "CANCELLED", cancelledBy: role },
        });

        // Free up the slot
        await tx.availabilitySlot.update({
            where: { id: appointment.slot.id },
            data: { isBooked: false },
        });
    });

    // Send cancellation email to the other party (non-blocking)
    const dateStr = format(appointment.slot.startTime, "MMMM d, yyyy");
    const timeStr = format(appointment.slot.startTime, "h:mm a");

    if (role === "PATIENT") {
        sendEmail({
            to: appointment.counselor.user.email,
            subject: "Appointment Cancelled - MindLens AI",
            html: cancellationEmail({
                recipientName: appointment.counselor.fullName,
                otherPartyName: appointment.patient.fullName,
                otherPartyRole: "Patient",
                date: dateStr,
                time: timeStr,
            }),
        }).catch(console.error);
    } else {
        sendEmail({
            to: appointment.patient.user.email,
            subject: "Appointment Cancelled - MindLens AI",
            html: cancellationEmail({
                recipientName: appointment.patient.fullName,
                otherPartyName: appointment.counselor.fullName,
                otherPartyRole: "Counselor",
                date: dateStr,
                time: timeStr,
            }),
        }).catch(console.error);
    }

    revalidatePath("/dashboard/patient/appointments");
    revalidatePath("/dashboard/counselor/appointments");
    return { success: "Appointment cancelled successfully" };
};

// ─── Mark appointment as completed (counselor only) ───
export const markAppointmentCompleted = async (appointmentId: string) => {
    const session = await auth();
    if (!session?.user || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            slot: true,
            counselor: { select: { userId: true } },
        },
    });

    if (!appointment) return { error: "Appointment not found" };
    if (appointment.counselor.userId !== session.user.id) return { error: "Unauthorized" };
    if (appointment.status !== "SCHEDULED") return { error: "Only scheduled appointments can be marked as completed" };

    const now = new Date();
    if (now < appointment.slot.endTime) {
        return { error: "You can only mark an appointment as completed after the session ends" };
    }

    await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" },
    });

    revalidatePath("/dashboard/counselor/appointments");
    revalidatePath("/dashboard/patient/appointments");
    return { success: "Appointment marked as completed" };
};

// ─── Add patient note ───
export const addPatientNote = async (appointmentId: string, note: string) => {
    const session = await auth();
    if (!session?.user || session.user.role !== "PATIENT") {
        return { error: "Unauthorized" };
    }

    if (!note.trim()) return { error: "Note cannot be empty" };
    if (note.length > 1000) return { error: "Note is too long (max 1000 characters)" };

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            slot: true,
            patient: { select: { userId: true } },
        },
    });

    if (!appointment) return { error: "Appointment not found" };
    if (appointment.patient.userId !== session.user.id) return { error: "Unauthorized" };
    if (appointment.status !== "SCHEDULED") return { error: "Notes can only be added to upcoming appointments" };

    const now = new Date();
    if (now >= appointment.slot.startTime) {
        return { error: "Notes can only be added before the appointment starts" };
    }

    await prisma.appointment.update({
        where: { id: appointmentId },
        data: { patientNote: note.trim() },
    });

    revalidatePath("/dashboard/patient/appointments");
    revalidatePath("/dashboard/counselor/appointments");
    return { success: "Note saved successfully" };
};

// ─── Adjust appointment time (counselor only) ───
export const adjustAppointmentTime = async (appointmentId: string, newSlotId: string) => {
    const session = await auth();
    if (!session?.user || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            slot: true,
            counselor: {
                select: {
                    userId: true,
                    fullName: true,
                },
            },
            patient: {
                select: {
                    fullName: true,
                    user: { select: { email: true } },
                },
            },
        },
    });

    if (!appointment) return { error: "Appointment not found" };
    if (appointment.counselor.userId !== session.user.id) return { error: "Unauthorized" };
    if (appointment.status !== "SCHEDULED") return { error: "Only scheduled appointments can be adjusted" };

    const now = new Date();
    const hoursUntilStart = (appointment.slot.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < ADJUST_CUTOFF_HOURS) {
        return { error: `Timing can only be adjusted at least ${ADJUST_CUTOFF_HOURS} hours before the appointment` };
    }

    // Verify the new slot is valid
    const newSlot = await prisma.availabilitySlot.findUnique({
        where: { id: newSlotId },
    });

    if (!newSlot || newSlot.isBooked || newSlot.isBlocked) {
        return { error: "Selected slot is not available" };
    }

    if (newSlot.counselorProfileId !== appointment.counselorProfileId) {
        return { error: "Invalid slot selection" };
    }

    await prisma.$transaction(async (tx) => {
        // Free old slot
        await tx.availabilitySlot.update({
            where: { id: appointment.slot.id },
            data: { isBooked: false },
        });

        // Book new slot
        await tx.availabilitySlot.update({
            where: { id: newSlotId },
            data: { isBooked: true },
        });

        // Update appointment
        await tx.appointment.update({
            where: { id: appointmentId },
            data: { slotId: newSlotId },
        });
    });

    // Send email notification to patient about the time change
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const oldStart = appointment.slot.startTime;
    const oldEnd = appointment.slot.endTime;

    try {
        await sendEmail({
            to: appointment.patient.user.email,
            subject: "Your Appointment Time Has Been Updated — MindLens AI",
            html: appointmentAdjustedEmail({
                patientName: appointment.patient.fullName,
                counselorName: appointment.counselor.fullName,
                date: format(newSlot.startTime, "EEEE, MMMM d, yyyy"),
                oldTime: `${format(oldStart, "h:mm a")} – ${format(oldEnd, "h:mm a")}`,
                newTime: `${format(newSlot.startTime, "h:mm a")} – ${format(newSlot.endTime, "h:mm a")}`,
                meetingLink: `${appUrl}/dashboard/meeting/${appointmentId}`,
            }),
        });
    } catch (e) {
        console.error("Failed to send adjustment email:", e);
    }

    revalidatePath("/dashboard/counselor/appointments");
    revalidatePath("/dashboard/patient/appointments");
    return { success: "Appointment time adjusted successfully" };
};

//submit review (patient only, completed appointments)
export const submitReview = async (appointmentId: string, rating: number, comment: string) => {
    const session = await auth();
    if (!session?.user || session.user.role !== "PATIENT") {
        return { error: "Unauthorized" };
    }

    if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5" };

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            patient: { select: { userId: true } },
            review: { select: { id: true } },
        },
    });

    if (!appointment) return { error: "Appointment not found" };
    if (appointment.patient.userId !== session.user.id) return { error: "Unauthorized" };
    if (appointment.status !== "COMPLETED") return { error: "Reviews can only be submitted for completed appointments" };
    if (appointment.review) return { error: "You have already reviewed this appointment" };

    await prisma.review.create({
        data: {
            appointmentId,
            rating,
            comment: comment.trim() || null,
        },
    });

    // check 1-star thresholds for the counselor and apply enforcement if needed
    if (rating === 1) {
        checkCounselorRatingEnforcement(appointment.counselorProfileId).catch(console.error);
    }

    revalidatePath("/dashboard/patient/appointments");
    return { success: "Review submitted successfully" };
};

// ─── Report patient (counselor only) ───
export const reportPatient = async (appointmentId: string, reason: string) => {
    const session = await auth();
    if (!session?.user || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    if (!reason.trim()) return { error: "Please provide a reason for the report" };
    if (reason.length > 2000) return { error: "Report reason is too long (max 2000 characters)" };

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            counselor: { select: { id: true, userId: true } },
            patient: { select: { id: true } },
            reports: { where: { counselorProfileId: undefined }, select: { id: true } },
        },
    });

    if (!appointment) return { error: "Appointment not found" };
    if (appointment.counselor.userId !== session.user.id) return { error: "Unauthorized" };
    if (appointment.status === "CANCELLED") return { error: "Cannot report a cancelled appointment" };

    // Check if already reported by this counselor
    const existingReport = await prisma.report.findFirst({
        where: {
            appointmentId,
            counselorProfileId: appointment.counselor.id,
        },
    });

    if (existingReport) return { error: "You have already reported this patient for this appointment" };

    await prisma.report.create({
        data: {
            appointmentId,
            counselorProfileId: appointment.counselor.id,
            patientProfileId: appointment.patient.id,
            reason: reason.trim(),
        },
    });

    // check report count thresholds and apply auto-suspend/ban if needed
    checkPatientReportEnforcement(appointment.patient.id).catch(console.error);

    revalidatePath("/dashboard/counselor/appointments");
    return { success: "Report submitted successfully" };
};

// ─── Get available slots for adjustment (counselor only) ───
export const getAvailableSlotsForAdjustment = async (counselorProfileId: string, appointmentDate: Date) => {
    const session = await auth();
    if (!session?.user || session.user.role !== "COUNSELOR") return [];

    const now = new Date();
    const cutoff = new Date(now.getTime() + ADJUST_CUTOFF_HOURS * 60 * 60 * 1000);

    // Only show slots on the same day as the original appointment
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Effective start: the later of cutoff or dayStart
    const effectiveStart = cutoff > dayStart ? cutoff : dayStart;

    const slots = await prisma.availabilitySlot.findMany({
        where: {
            counselorProfileId,
            isBooked: false,
            isBlocked: false,
            startTime: { gte: effectiveStart, lte: dayEnd },
        },
        orderBy: { startTime: "asc" },
        take: 50,
    });

    return slots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
    }));
};
