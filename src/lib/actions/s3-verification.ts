"use server";

import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// s3 client using env credentials
const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        // session token needed for learner lab temporary credentials
        sessionToken: process.env.AWS_SESSION_TOKEN,
    },
});

const BUCKET = process.env.AWS_BUCKET_NAME!;

// generates a presigned put url so the client can upload directly to s3
export const getVerificationUploadUrl = async (contentType: string) => {
    const session = await auth();
    if (!session || session.user.role !== "COUNSELOR") {
        return { error: "Unauthorized" };
    }

    // only allow pdf and image types
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

// saves the uploaded document url and sets verification status to pending
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

    const nestedPrefix = `verifications/${profile.id}/`;
    const legacyFlatPrefix = `verifications/${session.user.id}-`;
    const isNestedKey = fileKey.startsWith(nestedPrefix);
    const isLegacyKey =
        fileKey.startsWith(legacyFlatPrefix) && fileKey.split("/").length === 2;
    if (!isNestedKey && !isLegacyKey) {
        return { error: "Invalid document key" };
    }

    // build the public s3 url from the bucket and key
    const documentUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.verificationDocument.create({
                data: {
                    counselorProfileId: profile.id,
                    documentUrl,
                },
            });

            // set status back to pending after resubmission
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
