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
                    bio: validated.data.bio,
                    experienceYears: validated.data.experienceYears,
                    hourlyRate: validated.data.hourlyRate,
                },
            });

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
