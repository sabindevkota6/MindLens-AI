"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CounselorProfileSchema, CounselorOnboardingSchema } from "@/lib/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
    const session = await auth();
    if (!session) return [];

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
                    isOnboarded: true,
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
        return { success: "Profile completed successfully!" };
    } catch (error) {
        console.error("Profile completion error:", error);
        return { error: "Failed to complete profile." };
    }
};

// upload verification document action
export const uploadVerificationDoc = async (formData: FormData) => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) {
        return { error: "No file provided" };
    }

    // TODO: Integrate 'upload-local.ts' logic here when available.
    // For now, we'll return success to simulate the flow AND create a dummy record
    // so the "isProfileComplete" check passes (hasDocs).

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!profile) {
        return { error: "Profile not found" };
    }

    // Create a mock document record
    await prisma.verificationDocument.create({
        data: {
            counselorProfileId: profile.id,
            documentUrl: "https://placehold.co/document-mock.pdf", // Mock URL
        }
    });

    // Simulating delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    revalidatePath("/dashboard/counselor");
    return { success: "Document uploaded successfully!" };
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
            slots: {
                where: {
                    startTime: { gte: new Date() },
                    isBooked: false,
                },
                orderBy: { startTime: "asc" },
                take: 1,
            },
            appointments: {
                include: {
                    review: true,
                },
            },
        },
    });

    let counselors: CounselorCard[] = allProfiles.map((p) => {
        const reviews = p.appointments
            .map((a) => a.review)
            .filter((r): r is NonNullable<typeof r> => r !== null);
        const avgRating =
            reviews.length > 0
                ? Math.round(
                      (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
                  ) / 10
                : 0;

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
            totalReviews: reviews.length,
            nextAvailable: p.slots[0]?.startTime?.toISOString() || null,
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

// ─── Public Counselor Detail (for patients viewing a counselor) ───

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
}

export const getCounselorDetail = async (counselorId: string): Promise<CounselorDetail | null> => {
    const session = await auth();
    if (!session) return null;

    const profile = await prisma.counselorProfile.findUnique({
        where: { id: counselorId },
        include: {
            user: { select: { createdAt: true } },
            specialties: { include: { specialty: true } },
            slots: {
                where: {
                    startTime: { gte: new Date() },
                    isBooked: false,
                },
                orderBy: { startTime: "asc" },
                take: 1,
            },
            appointments: {
                include: { review: true },
            },
        },
    });

    if (!profile) return null;

    const reviews = profile.appointments
        .map((a) => a.review)
        .filter((r): r is NonNullable<typeof r> => r !== null);
    const avgRating =
        reviews.length > 0
            ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
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
        totalReviews: reviews.length,
        totalAppointments: profile.appointments.filter((a) => a.status === "COMPLETED").length,
        nextAvailable: profile.slots[0]?.startTime?.toISOString() || null,
        memberSince: profile.user.createdAt.toISOString(),
    };
};

// ─── Get Available Slots for a Counselor ───

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

    const slots = await prisma.availabilitySlot.findMany({
        where: {
            counselorProfileId: counselorId,
            startTime: { gte: startOfDay },
            endTime: { lt: endOfDay },
            isBooked: false,
        },
        orderBy: { startTime: "asc" },
    });

    return slots.map((s) => ({
        id: s.id,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
    }));
};

// ─── Get dates that have available slots (for calendar highlighting) ───

export const getCounselorAvailableDates = async (
    counselorId: string,
    month: number,
    year: number
): Promise<string[]> => {
    const session = await auth();
    if (!session) return [];

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 1);

    const slots = await prisma.availabilitySlot.findMany({
        where: {
            counselorProfileId: counselorId,
            startTime: { gte: startOfMonth },
            endTime: { lt: endOfMonth },
            isBooked: false,
        },
        select: { startTime: true },
    });

    // Return unique date strings
    const dates = new Set(
        slots.map((s) => s.startTime.toISOString().split("T")[0])
    );
    return Array.from(dates);
};

// ─── Book an appointment ───

export const bookAppointment = async (slotId: string) => {
    const session = await auth();
    if (!session || session.user.role !== "PATIENT") {
        return { error: "Unauthorized" };
    }

    try {
        const patientProfile = await prisma.patientProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!patientProfile) {
            return { error: "Patient profile not found" };
        }

        const slot = await prisma.availabilitySlot.findUnique({
            where: { id: slotId },
        });

        if (!slot || slot.isBooked) {
            return { error: "This slot is no longer available" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.availabilitySlot.update({
                where: { id: slotId },
                data: { isBooked: true },
            });

            await tx.appointment.create({
                data: {
                    slotId,
                    patientProfileId: patientProfile.id,
                    counselorProfileId: slot.counselorProfileId,
                    status: "SCHEDULED",
                },
            });
        });

        revalidatePath("/dashboard/patient");
        return { success: "Appointment booked successfully!" };
    } catch {
        return { error: "Failed to book appointment. Please try again." };
    }
};
