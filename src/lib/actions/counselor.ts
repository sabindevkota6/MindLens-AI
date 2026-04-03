"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CounselorProfileSchema, CounselorOnboardingSchema } from "@/lib/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createNotifications } from "@/lib/notifications";

// get counselor profile data
export const getCounselorProfile = async () => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") return null;

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            user: {
                select: { email: true, phoneNumber: true, createdAt: true }
            },
            documents: true,
            specialties: {
                include: {
                    specialty: true
                }
            }
        },
    });

    if (!profile) return null;

    // Convert decimal to number for serialization
    return {
        ...profile,
        hourlyRate: Number(profile.hourlyRate),
        // flatten specialties for easier consumption if needed, or keep as is
    };
};

export const getAllSpecialties = async () => {
    return await prisma.specialtyType.findMany({
        orderBy: { name: 'asc' }
    });
};

// update counselor profile
export const updateCounselorProfile = async (values: z.infer<typeof CounselorProfileSchema>) => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    const validated = CounselorProfileSchema.safeParse(values);
    if (!validated.success) {
        return { error: "Invalid fields" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Updated Profile Data
            await tx.counselorProfile.update({
                where: { userId: session.user.id },
                data: {
                    fullName: validated.data.fullName,
                    professionalTitle: validated.data.professionalTitle,
                    bio: validated.data.bio,
                    experienceYears: validated.data.experienceYears,
                    hourlyRate: validated.data.hourlyRate,
                    dateOfBirth: new Date(validated.data.dateOfBirth),
                },
            });

            // Update user phone number
            if (validated.data.phoneNumber !== undefined) {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { phoneNumber: validated.data.phoneNumber || null },
                });
            }

            // Handle Specialties Relation
            if (validated.data.specialties || validated.data.customSpecialties) {
                const profile = await tx.counselorProfile.findUnique({
                    where: { userId: session.user.id },
                    select: { id: true }
                });

                if (profile) {
                    let allSpecialtyIds = [...(validated.data.specialties || [])];

                    // Process custom specialties
                    if (validated.data.customSpecialties && validated.data.customSpecialties.length > 0) {
                        for (const name of validated.data.customSpecialties) {
                            if (!name.trim()) continue;
                            const specialty = await tx.specialtyType.upsert({
                                where: { name: name.trim() },
                                update: {},
                                create: { name: name.trim() },
                            });
                            allSpecialtyIds.push(specialty.id);
                        }
                    }

                    // Deduplicate IDs to avoid unique constraint violations
                    const uniqueSpecialties = Array.from(new Set(allSpecialtyIds));

                    // 1. Remove existing
                    await tx.counselorSpecialty.deleteMany({
                        where: { counselorProfileId: profile.id }
                    });

                    // 2. Add new
                    if (uniqueSpecialties.length > 0) {
                        await tx.counselorSpecialty.createMany({
                            data: uniqueSpecialties.map((specialtyId) => ({
                                counselorProfileId: profile.id,
                                specialtyId: specialtyId,
                            })),
                        });
                    }
                }
            }
        });

        revalidatePath("/dashboard/counselor");
        revalidatePath("/dashboard/counselor/profile");
        return { success: "Profile updated successfully!" };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Failed to update profile. " + (error instanceof Error ? error.message : "") };
    }
};

// complete counselor profile (onboarding)
export const completeCounselorProfile = async (values: z.infer<typeof CounselorOnboardingSchema>) => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    const validated = CounselorOnboardingSchema.safeParse(values);
    if (!validated.success) {
        console.error("Validation errors:", validated.error.flatten());
        return { error: "Invalid fields" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // update profile
            const updatedProfile = await tx.counselorProfile.update({
                where: { userId: session.user.id },
                data: {
                    professionalTitle: validated.data.professionalTitle,
                    bio: validated.data.bio,
                    experienceYears: validated.data.experienceYears,
                    hourlyRate: validated.data.hourlyRate,
                    dateOfBirth: new Date(validated.data.dateOfBirth),
                },
            });

            // update user phone number
            if (validated.data.phoneNumber) {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: {
                        phoneNumber: validated.data.phoneNumber,
                    },
                });
            }

            // Handle specialties
            if (validated.data.specialties || validated.data.customSpecialties) {
                let allSpecialtyIds = [...(validated.data.specialties || [])];

                // Process custom specialties
                if (validated.data.customSpecialties && validated.data.customSpecialties.length > 0) {
                    for (const name of validated.data.customSpecialties) {
                        if (!name.trim()) continue;
                        const specialty = await tx.specialtyType.upsert({
                            where: { name: name.trim() },
                            update: {},
                            create: { name: name.trim() },
                        });
                        allSpecialtyIds.push(specialty.id);
                    }
                }

                const uniqueSpecialties = Array.from(new Set(allSpecialtyIds));

                // Remove existing specialties first to avoid unique constraint violations
                await tx.counselorSpecialty.deleteMany({
                    where: { counselorProfileId: updatedProfile.id },
                });

                if (uniqueSpecialties.length > 0) {
                    await tx.counselorSpecialty.createMany({
                        data: uniqueSpecialties.map((specialtyId) => ({
                            counselorProfileId: updatedProfile.id,
                            specialtyId,
                        })),
                    });
                }
            }
        });

        revalidatePath("/dashboard/counselor");
        revalidatePath("/dashboard/counselor/onboarding");
        return { success: "Profile completed successfully!" };
    } catch (error) {
        console.error("Profile completion error:", error);
        return { error: "Failed to complete profile." };
    }
};

/** Call after onboarding step 3 when the counselor skips document upload. */
export const markCounselorOnboardingComplete = async () => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }
    try {
        await prisma.counselorProfile.update({
            where: { userId: session.user.id },
            data: { isOnboarded: true },
        });
        revalidatePath("/dashboard/counselor");
        revalidatePath("/dashboard/counselor/onboarding");
        revalidatePath("/dashboard/counselor/profile");
        return { success: true as const };
    } catch {
        return { error: "Failed to complete onboarding." };
    }
};

export interface SearchCounselorsParams {
    query?: string;
    specialtyId?: number;
    availabilityDate?: string;
    minRating?: number;
    minExperience?: number;
    sortBy?: "rating" | "experience";
    sortOrder?: "asc" | "desc";
    page?: number;
    perPage?: number;
}

export interface CounselorCard {
    id: string;
    fullName: string;
    professionalTitle: string | null;
    bio: string | null;
    experienceYears: number;
    hourlyRate: number;
    verificationStatus: string;
    specialties: string[];
    avgRating: number;
    totalReviews: number;
    nextAvailable: string | null;
    image: string | null;
}

export interface SearchCounselorsResult {
    counselors: CounselorCard[];
    total: number;
    page: number;
    totalPages: number;
}

export const searchCounselors = async (
    params: SearchCounselorsParams
): Promise<SearchCounselorsResult> => {
    const session = await auth();
    if (!session) return { counselors: [], total: 0, page: 1, totalPages: 0 };

    const {
        query,
        specialtyId,
        availabilityDate,
        minRating,
        minExperience,
        sortBy,
        sortOrder = "desc",
        page = 1,
        perPage = 6,
    } = params;

    const where: any = {
        verificationStatus: "VERIFIED",
        isOnboarded: true,
        // exclude banned and suspended counselors from patient-facing search
        user: { isBanned: false, isSuspended: false },
    };

    if (query && query.trim()) {
        const search = query.trim();
        where.OR = [
            { fullName: { contains: search, mode: "insensitive" } },
            { professionalTitle: { contains: search, mode: "insensitive" } },
            {
                specialties: {
                    some: {
                        specialty: {
                            name: { contains: search, mode: "insensitive" },
                        },
                    },
                },
            },
        ];
    }

    if (specialtyId) {
        where.specialties = {
            some: { specialtyId },
        };
    }

    if (availabilityDate) {
        const date = new Date(availabilityDate);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        where.slots = {
            some: {
                startTime: { gte: startOfDay },
                endTime: { lt: endOfDay },
                isBooked: false,
                isBlocked: false,
            },
        };
    }

    if (minExperience && minExperience > 0) {
        where.experienceYears = { gte: minExperience };
    }

    const allProfiles = await prisma.counselorProfile.findMany({
        where,
        include: {
            specialties: {
                include: { specialty: true },
            },
            // include image so counselor cards can show real profile pictures
            user: { select: { image: true } },
            slots: {
                where: {
                    startTime: { gte: new Date() },
                    isBooked: false,
                    isBlocked: false,
                },
                orderBy: { startTime: "asc" },
                take: 1,
            },
        },
    });

    // Batch-fetch review stats for all matched counselors in ONE aggregate query
    const profileIds = allProfiles.map((p) => p.id);
    const reviewStats = profileIds.length > 0
        ? await prisma.$queryRaw<{ counselorProfileId: string; avgRating: number; totalReviews: number }[]>`
            SELECT a."counselorProfileId",
                   COALESCE(AVG(r.rating), 0)::float AS "avgRating",
                   COUNT(r.id)::int AS "totalReviews"
            FROM "Appointment" a
            JOIN "Review" r ON r."appointmentId" = a.id
            WHERE a."counselorProfileId" = ANY(${profileIds})
            GROUP BY a."counselorProfileId"
          `
        : [];

    const statsMap = new Map(
        reviewStats.map((s) => [s.counselorProfileId, s])
    );

    let counselors: CounselorCard[] = allProfiles.map((p) => {
        const stats = statsMap.get(p.id);
        const avgRating = stats ? Math.round(stats.avgRating * 10) / 10 : 0;
        const totalReviews = stats?.totalReviews ?? 0;

        return {
            id: p.id,
            fullName: p.fullName,
            professionalTitle: p.professionalTitle,
            bio: p.bio,
            experienceYears: p.experienceYears,
            hourlyRate: Number(p.hourlyRate),
            verificationStatus: p.verificationStatus,
            specialties: p.specialties.map((s) => s.specialty.name),
            avgRating,
            totalReviews,
            nextAvailable: p.slots[0]?.startTime?.toISOString() || null,
            image: p.user.image ?? null,
        };
    });

    if (minRating && minRating > 0) {
        counselors = counselors.filter((c) => c.avgRating >= minRating);
    }

    if (sortBy === "rating") {
        counselors.sort((a, b) =>
            sortOrder === "desc" ? b.avgRating - a.avgRating : a.avgRating - b.avgRating
        );
    } else if (sortBy === "experience") {
        counselors.sort((a, b) =>
            sortOrder === "desc"
                ? b.experienceYears - a.experienceYears
                : a.experienceYears - b.experienceYears
        );
    } else {
        counselors.sort((a, b) => b.avgRating - a.avgRating);
    }

    const total = counselors.length;
    const totalPages = Math.ceil(total / perPage);
    const paginated = counselors.slice((page - 1) * perPage, page * perPage);

    return {
        counselors: paginated,
        total,
        page,
        totalPages,
    };
};

// Public Counselor Detail (for patients viewing a counselor)

export interface CounselorDetail {
    id: string;
    fullName: string;
    professionalTitle: string | null;
    bio: string | null;
    experienceYears: number;
    hourlyRate: number;
    verificationStatus: string;
    specialties: string[];
    avgRating: number;
    totalReviews: number;
    totalAppointments: number;
    nextAvailable: string | null;
    memberSince: string;
    image: string | null;
}

export const getCounselorDetail = async (counselorId: string): Promise<CounselorDetail | null> => {
    const session = await auth();
    if (!session) return null;

    // Run profile query, review stats, and completed count in PARALLEL
    const [profile, reviewStats, completedCount] = await Promise.all([
        prisma.counselorProfile.findUnique({
            where: { id: counselorId },
            include: {
                user: { select: { createdAt: true, image: true } },
                specialties: { include: { specialty: true } },
                slots: {
                    where: {
                        startTime: { gte: new Date() },
                        isBooked: false,
                        isBlocked: false,
                    },
                    orderBy: { startTime: "asc" },
                    take: 1,
                },
            },
        }),
        prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
            where: {
                appointment: { counselorProfileId: counselorId },
            },
        }),
        prisma.appointment.count({
            where: {
                counselorProfileId: counselorId,
                status: "COMPLETED",
            },
        }),
    ]);

    if (!profile) return null;

    const avgRating = reviewStats._avg.rating
        ? Math.round(reviewStats._avg.rating * 10) / 10
        : 0;

    return {
        id: profile.id,
        fullName: profile.fullName,
        professionalTitle: profile.professionalTitle,
        bio: profile.bio,
        experienceYears: profile.experienceYears,
        hourlyRate: Number(profile.hourlyRate),
        verificationStatus: profile.verificationStatus,
        specialties: profile.specialties.map((s) => s.specialty.name),
        avgRating,
        totalReviews: reviewStats._count.id,
        totalAppointments: completedCount,
        nextAvailable: profile.slots[0]?.startTime?.toISOString() || null,
        memberSince: profile.user.createdAt.toISOString(),
        image: profile.user.image ?? null,
    };
};

// Get Available Slots for a Counselor

export interface AvailableSlot {
    id: string;
    startTime: string;
    endTime: string;
}

export const getCounselorAvailableSlots = async (
    counselorId: string,
    dateStr: string
): Promise<AvailableSlot[]> => {
    const session = await auth();
    if (!session) return [];

    const date = new Date(dateStr);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const now = new Date();

    const activeSchedule = await prisma.recurringSchedule.findMany({
        where: { counselorProfileId: counselorId },
        select: { dayOfWeek: true },
    });
    const activeDays = [...new Set(activeSchedule.map((s) => s.dayOfWeek))];

    const slots = await prisma.availabilitySlot.findMany({
        where: {
            counselorProfileId: counselorId,
            startTime: { gte: startOfDay > now ? startOfDay : now },
            endTime: { lt: endOfDay },
            isBooked: false,
            isBlocked: false,
        },
        orderBy: { startTime: "asc" },
    });

    return slots
        .filter((s) => activeDays.includes(s.startTime.getDay()))
        .map((s) => ({
            id: s.id,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
        }));
};

// Get dates that have available slots (for calendar highlighting)

export const getCounselorAvailableDates = async (
    counselorId: string,
    month: number,
    year: number
): Promise<string[]> => {
    const session = await auth();
    if (!session) return [];

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 1);

    const now = new Date();
    const rangeStart = startOfMonth > now ? startOfMonth : now;

    // Fetch active schedule days
    const activeSchedule = await prisma.recurringSchedule.findMany({
        where: { counselorProfileId: counselorId },
        select: { dayOfWeek: true },
    });
    const activeDays = [...new Set(activeSchedule.map((s) => s.dayOfWeek))];

    const slots = await prisma.availabilitySlot.findMany({
        where: {
            counselorProfileId: counselorId,
            startTime: { gte: rangeStart },
            endTime: { lt: endOfMonth },
            isBooked: false,
            isBlocked: false,
        },
        select: { startTime: true },
    });

    // return unique local date strings (must match client calendar format)
    const dates = new Set(
        slots
            .filter((s) => activeDays.includes(s.startTime.getDay()))
            .map((s) => {
                const d = s.startTime;
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            })
    );
    return Array.from(dates);
};

// Book an appointment

export const bookAppointment = async (slotId: string) => {
    const session = await auth();
    if (!session || session.user.role !== "PATIENT") {
        return { error: "Unauthorized" };
    }

    try {
        const patientProfile = await prisma.patientProfile.findUnique({
            where: { userId: session.user.id },
            include: { user: { select: { email: true } } },
        });

        if (!patientProfile) {
            return { error: "Patient profile not found" };
        }

        const slot = await prisma.availabilitySlot.findUnique({
            where: { id: slotId },
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
        });

        if (!slot || slot.isBooked || slot.isBlocked) {
            return { error: "This slot is no longer available" };
        }

        // Prevent multiple bookings on the same day with same counselor
        const slotDate = new Date(slot.startTime);
        const startOfDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                patientProfileId: patientProfile.id,
                counselorProfileId: slot.counselorProfileId,
                status: { not: "CANCELLED" },
                slot: {
                    startTime: { gte: startOfDay },
                    endTime: { lt: endOfDay },
                },
            },
        });

        if (existingAppointment) {
            return { error: "You already have an appointment with this counselor on this day. Please choose a different date or different counselor." };
        }

        const existingSlotAppt = await prisma.appointment.findUnique({ where: { slotId } });

        let appointmentId: string = "";
        let inAppMeetingUrl: string | null = null;

        await prisma.$transaction(async (tx) => {
            await tx.availabilitySlot.update({
                where: { id: slotId },
                data: { isBooked: true },
            });

            // slotId is @unique on Appointment — if a cancelled appointment already holds
            // this slotId (slot was previously booked then cancelled), we must update it
            // rather than insert a new record to avoid a unique constraint violation.
            let created: { id: string };
            if (existingSlotAppt?.status === "CANCELLED") {
                created = await tx.appointment.update({
                    where: { id: existingSlotAppt.id },
                    data: {
                        patientProfileId: patientProfile.id,
                        counselorProfileId: slot.counselorProfileId,
                        status: "SCHEDULED",
                        cancelledBy: null,
                        meetingLink: null,
                        patientNote: null,
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
                        status: "SCHEDULED",
                    },
                });
            }
            appointmentId = created.id;

            const { createInternalMeetingLink } = await import("@/lib/jitsi");
            inAppMeetingUrl = createInternalMeetingLink(created.id);

            await tx.appointment.update({
                where: { id: created.id },
                data: { meetingLink: inAppMeetingUrl },
            });
        });

        // send confirmation emails to both parties (non-blocking)
        if (inAppMeetingUrl && appointmentId) {
            const { format } = await import("date-fns");
            const { bookingConfirmationEmail, counselorBookingNotificationEmail } = await import("@/lib/email-templates");
            const { sendEmail } = await import("@/lib/email");
            const dateStr = format(slot.startTime, "MMMM d, yyyy");
            const timeStr = format(slot.startTime, "h:mm a");

            // email to patient
            sendEmail({
                to: patientProfile.user.email,
                subject: "Appointment Confirmed - MindLens AI",
                html: bookingConfirmationEmail({
                    patientName: patientProfile.fullName,
                    counselorName: slot.counselor.fullName,
                    counselorTitle: slot.counselor.professionalTitle || "Counselor",
                    date: dateStr,
                    time: timeStr,
                    meetingLink: inAppMeetingUrl,
                }),
            }).catch(console.error);

            // email to counselor
            sendEmail({
                to: slot.counselor.user.email,
                subject: "New Appointment Booked - MindLens AI",
                html: counselorBookingNotificationEmail({
                    counselorName: slot.counselor.fullName,
                    patientName: patientProfile.fullName,
                    date: dateStr,
                    time: timeStr,
                    meetingLink: inAppMeetingUrl,
                }),
            }).catch(console.error);

            // in-app notifications for both parties
            createNotifications([
                {
                    userId: patientProfile.userId,
                    type: "APPOINTMENT_BOOKED",
                    title: "Appointment Confirmed",
                    body: `Your session with ${slot.counselor.fullName} is set for ${dateStr} at ${timeStr}.`,
                    data: { href: `/dashboard/patient/appointments/${appointmentId}` },
                },
                {
                    userId: slot.counselor.userId,
                    type: "APPOINTMENT_BOOKED",
                    title: "New Appointment Booked",
                    body: `${patientProfile.fullName} booked a session with you for ${dateStr} at ${timeStr}.`,
                    data: { href: `/dashboard/counselor/appointments/${appointmentId}` },
                },
            ]).catch(console.error);
        }

        revalidatePath("/dashboard/patient");
        return { success: "Appointment booked successfully! You will receive the meeting link via email. You can join the meeting 30 minutes before the scheduled time." };
    } catch {
        return { error: "Failed to book appointment. Please try again." };
    }
};

// Recurring Schedule Management

export const getRecurringSchedule = async (userId?: string) => {
    let uid = userId;
    if (!uid) {
        const session = await auth();
        if (!session || session.user.role !== "COUNSELOR") return [];
        uid = session.user.id;
    }

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: uid },
        select: { id: true },
    });
    if (!profile) return [];

    const schedules = await prisma.recurringSchedule.findMany({
        where: { counselorProfileId: profile.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
    }));
};

// Save Recurring Schedule & Generate Slots

const SLOT_DURATION_MINUTES = 60;
const GENERATION_WEEKS = 4;

function getDayName(dayOfWeek: number): string {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];
}

interface ScheduleEntry {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

function generateSlotsFromSchedule(
    entries: ScheduleEntry[],
    numWeeks: number
): { startTime: Date; endTime: Date }[] {
    const slots: { startTime: Date; endTime: Date }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayDow = today.getDay();

    for (const entry of entries) {
        const daysUntilFirst = (entry.dayOfWeek - todayDow + 7) % 7;

        for (let week = 0; week < numWeeks; week++) {
            const date = new Date(today);
            date.setDate(today.getDate() + daysUntilFirst + week * 7);

            const [startH, startM] = entry.startTime.split(":").map(Number);
            const [endH, endM] = entry.endTime.split(":").map(Number);
            const endMinutes = endH * 60 + endM;

            let currentH = startH;
            let currentM = startM;

            while (true) {
                const slotStart = new Date(date);
                slotStart.setHours(currentH, currentM, 0, 0);

                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION_MINUTES);

                const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();
                if (slotEndMinutes > endMinutes || slotEnd.getDate() !== date.getDate()) break;

                // Only add future slots
                if (slotStart > now) {
                    slots.push({ startTime: slotStart, endTime: slotEnd });
                }

                currentM += SLOT_DURATION_MINUTES;
                currentH += Math.floor(currentM / 60);
                currentM %= 60;
            }
        }
    }

    // deduplicate overlapping slots across multiple time blocks on the same day
    slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const deduped: { startTime: Date; endTime: Date }[] = [];
    for (const slot of slots) {
        const last = deduped[deduped.length - 1];
        if (!last || slot.startTime >= last.endTime) {
            deduped.push(slot);
        }
    }
    return deduped;
}

function hasOverlappingBlocks(blocks: { startTime: string; endTime: string }[]): boolean {
    const sorted = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime < sorted[i - 1].endTime) return true;
    }
    return false;
}

export const saveRecurringSchedule = async (values: {
    schedule: {
        dayOfWeek: number;
        enabled: boolean;
        timeBlocks: { startTime: string; endTime: string }[];
    }[];
}) => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    if (!values.schedule || values.schedule.length !== 7) {
        return { error: "Invalid schedule data" };
    }

    // Validate each enabled day
    for (const day of values.schedule) {
        if (!day.enabled) continue;

        if (day.timeBlocks.length === 0) {
            return { error: `${getDayName(day.dayOfWeek)} is enabled but has no time blocks` };
        }

        for (const block of day.timeBlocks) {
            if (!/^\d{2}:\d{2}$/.test(block.startTime) || !/^\d{2}:\d{2}$/.test(block.endTime)) {
                return { error: `${getDayName(day.dayOfWeek)}: Invalid time format` };
            }

            const [sh, sm] = block.startTime.split(":").map(Number);
            const [eh, em] = block.endTime.split(":").map(Number);
            const startMins = sh * 60 + sm;
            const endMins = eh * 60 + em;

            if (endMins <= startMins) {
                return { error: `${getDayName(day.dayOfWeek)}: End time must be after start time` };
            }
            if (endMins - startMins < SLOT_DURATION_MINUTES) {
                return { error: `${getDayName(day.dayOfWeek)}: Time block must be at least 1 hour` };
            }
        }

        if (hasOverlappingBlocks(day.timeBlocks)) {
            return { error: `${getDayName(day.dayOfWeek)}: Time blocks overlap each other` };
        }
    }

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });
    if (!profile) return { error: "Profile not found" };

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Delete existing recurring schedules
            await tx.recurringSchedule.deleteMany({
                where: { counselorProfileId: profile.id },
            });

            // 2. Create new recurring schedule entries
            const entries: ScheduleEntry[] = values.schedule
                .filter((d) => d.enabled)
                .flatMap((d) =>
                    d.timeBlocks.map((tb) => ({
                        dayOfWeek: d.dayOfWeek,
                        startTime: tb.startTime,
                        endTime: tb.endTime,
                    }))
                );

            if (entries.length > 0) {
                await tx.recurringSchedule.createMany({
                    data: entries.map((e) => ({
                        counselorProfileId: profile.id,
                        dayOfWeek: e.dayOfWeek,
                        startTime: e.startTime,
                        endTime: e.endTime,
                    })),
                });
            }


            // 3. Delete pure empty slots
            await tx.availabilitySlot.deleteMany({
                where: {
                    counselorProfileId: profile.id,
                    startTime: { gt: new Date() },
                    isBooked: false,
                    appointment: { is: null },
                },
            });

            // 4. Generate new slots from schedule
            const newSlots = generateSlotsFromSchedule(entries, GENERATION_WEEKS);

            // 5. Manage existing slots and resolve conflicts
            const existingSlots = await tx.availabilitySlot.findMany({
                where: {
                    counselorProfileId: profile.id,
                    startTime: { gt: new Date() },
                },
                select: { id: true, startTime: true, endTime: true, isBooked: true, isBlocked: true },
            });

            const slotsToInsert = [];

            for (const nSlot of newSlots) {
                const overlaps = existingSlots.filter(
                    (e) => nSlot.startTime < e.endTime && nSlot.endTime > e.startTime
                );

                if (overlaps.length === 0) {
                    slotsToInsert.push(nSlot);
                } else {
                    let madeAvailable = false;
                    for (const overlap of overlaps) {
                        if (overlap.isBooked) {
                            madeAvailable = true;
                        } else if (!madeAvailable) {
                            if (overlap.isBlocked) {
                                await tx.availabilitySlot.update({
                                    where: { id: overlap.id },
                                    data: { isBlocked: false },
                                });
                                overlap.isBlocked = false;
                            }
                            madeAvailable = true;
                        } else if (madeAvailable && !overlap.isBooked && !overlap.isBlocked) {
                            await tx.availabilitySlot.update({
                                where: { id: overlap.id },
                                data: { isBlocked: true },
                            });
                            overlap.isBlocked = true;
                        }
                    }
                }
            }

            // 6. Block leftover unfilled existing slots that fall outside the schedule
            for (const eSlot of existingSlots) {
                if (eSlot.isBooked) continue;

                const isCoveredByNew = newSlots.some(
                    (nSlot) => nSlot.startTime <= eSlot.startTime && nSlot.endTime >= eSlot.endTime
                );

                if (!isCoveredByNew && !eSlot.isBlocked) {
                    await tx.availabilitySlot.update({
                        where: { id: eSlot.id },
                        data: { isBlocked: true },
                    });
                }
            }

            // 7. Insert the generated non-conflicting slots
            if (slotsToInsert.length > 0) {
                await tx.availabilitySlot.createMany({
                    data: slotsToInsert.map((s) => ({
                        counselorProfileId: profile.id,
                        startTime: s.startTime,
                        endTime: s.endTime,
                    })),
                });
            }
        });

        revalidatePath("/dashboard/counselor/availability");
        revalidatePath("/dashboard/counselor");
        return { success: "Schedule saved and slots generated!" };
    } catch (error) {
        console.error("Save schedule error:", error);
        return { error: "Failed to save schedule. Please try again." };
    }
};

// Get global slot statistics (all future slots, not just current week)

export interface SlotStats {
    total: number;
    available: number;
    booked: number;
    blocked: number;
}

export const getSlotStats = async (userId?: string): Promise<SlotStats> => {
    let uid = userId;
    if (!uid) {
        const session = await auth();
        if (!session || session.user.role !== "COUNSELOR") return { total: 0, available: 0, booked: 0, blocked: 0 };
        uid = session.user.id;
    }

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: uid },
        select: { id: true },
    });
    if (!profile) return { total: 0, available: 0, booked: 0, blocked: 0 };

    const now = new Date();

    const [total, booked, blocked] = await Promise.all([
        prisma.availabilitySlot.count({
            where: { counselorProfileId: profile.id, startTime: { gt: now } },
        }),
        prisma.availabilitySlot.count({
            where: { counselorProfileId: profile.id, startTime: { gt: now }, isBooked: true },
        }),
        prisma.availabilitySlot.count({
            where: { counselorProfileId: profile.id, startTime: { gt: now }, isBlocked: true, isBooked: false },
        }),
    ]);

    return {
        total,
        available: total - booked - blocked,
        booked,
        blocked,
    };
};

// Get Availability Slots for Management (Counselor View)

export interface ManagedSlot {
    id: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    isBlocked: boolean;
    patientName?: string;
}

export const getAvailabilitySlots = async (
    weekStartStr: string,
    userId?: string
): Promise<ManagedSlot[]> => {
    let uid = userId;
    if (!uid) {
        const session = await auth();
        if (!session || session.user.role !== "COUNSELOR") return [];
        uid = session.user.id;
    }

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: uid },
        select: { id: true },
    });
    if (!profile) return [];

    const weekStart = new Date(weekStartStr);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const activeSchedule = await prisma.recurringSchedule.findMany({
        where: { counselorProfileId: profile.id },
        select: { dayOfWeek: true },
    });
    const activeDays = [...new Set(activeSchedule.map((s) => s.dayOfWeek))];

    const slots = await prisma.availabilitySlot.findMany({
        where: {
            counselorProfileId: profile.id,
            startTime: { gte: weekStart },
            endTime: { lte: weekEnd },
        },
        include: {
            appointment: {
                include: {
                    patient: { select: { fullName: true } },
                },
            },
        },
        orderBy: { startTime: "asc" },
    });

    return slots
        .filter((s) => activeDays.includes(s.startTime.getDay()))
        .map((s) => ({
            id: s.id,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            isBooked: s.isBooked,
            isBlocked: s.isBlocked,
            patientName: s.appointment?.patient?.fullName,
        }));
};

// Toggle Slot Block/Unblock

export const toggleSlotBlock = async (slotId: string) => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });
    if (!profile) return { error: "Profile not found" };

    const slot = await prisma.availabilitySlot.findUnique({
        where: { id: slotId },
    });

    if (!slot) return { error: "Slot not found" };
    if (slot.counselorProfileId !== profile.id) return { error: "Unauthorized" };
    if (slot.isBooked) return { error: "Cannot modify a booked slot" };
    if (slot.startTime <= new Date()) return { error: "Cannot modify past slots" };

    await prisma.availabilitySlot.update({
        where: { id: slotId },
        data: { isBlocked: !slot.isBlocked },
    });

    revalidatePath("/dashboard/counselor/availability");
    return {
        success: slot.isBlocked ? "Slot unblocked successfully" : "Slot blocked successfully",
    };
};
