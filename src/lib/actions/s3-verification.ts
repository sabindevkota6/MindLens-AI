"use server";

import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// s3 client for uploading counselor verification documents
const s3 = new S3Client({
    region: process.env.MY_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
        // session token is required for learner lab temporary credentials
        sessionToken: process.env.MY_AWS_SESSION_TOKEN,
    },
});

// s3 bucket name read from env so it can differ between environments
const BUCKET = process.env.MY_AWS_BUCKET_NAME!;

// generates a presigned put url so the counselor's browser can upload the document directly to s3
export const getVerificationUploadUrl = async (contentType: string) => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    // only pdf and common image formats are accepted for verification documents
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(contentType)) {
        return { error: "Invalid file type. Only PDF, JPG, and PNG are allowed." };
    }

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });

    if (!profile) {
        return { error: "Profile not found" };
    }

    const fileKey = `verifications/${profile.id}/${Date.now()}-${randomUUID()}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileKey,
        ContentType: contentType,
    });

    try {
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
        return { signedUrl, fileKey };
    } catch {
        return { error: "Failed to generate upload URL. Please try again." };
    }
};

// saves the uploaded document url to the database and resets verification status to pending
export const submitVerificationRecord = async (fileKey: string) => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    const profile = await prisma.counselorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });

    if (!profile) {
        return { error: "Profile not found" };
    }

    // accept both the current nested key format and the older flat key format for backwards compatibility
    const nestedPrefix = `verifications/${profile.id}/`;
    const legacyFlatPrefix = `verifications/${session.user.id}-`;
    const isNestedKey = fileKey.startsWith(nestedPrefix);
    const isLegacyKey =
        fileKey.startsWith(legacyFlatPrefix) && fileKey.split("/").length === 2;
    if (!isNestedKey && !isLegacyKey) {
        return { error: "Invalid document key" };
    }

    // build the public https url from the bucket name, region, and file key
    const documentUrl = `https://${BUCKET}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${fileKey}`;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.verificationDocument.create({
                data: {
                    counselorProfileId: profile.id,
                    documentUrl,
                },
            });

            // reset verification status to pending so admin reviews the new document
            await tx.counselorProfile.update({
                where: { id: profile.id },
                data: { verificationStatus: "PENDING", isOnboarded: true },
            });
        });

        revalidatePath("/dashboard/counselor");
        revalidatePath("/dashboard/counselor/onboarding");
        revalidatePath("/dashboard/counselor/profile");

        return { success: "Verification document submitted successfully!" };
    } catch {
        return { error: "Failed to save document record. Please try again." };
    }
};
