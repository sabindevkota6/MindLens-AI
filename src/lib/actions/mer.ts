"use server";

import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// using presigned urls let the browser upload directly to s3 for bypassing next.js server payload limits entirely
const ALLOWED_CONTENT_TYPES = [
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
];

// s3 client configured for aws learner lab
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!,
  },
});

export async function getMerUploadUrl(contentType: string): Promise<
  { success: true; signedUrl: string; fileKey: string } | { error: string }
> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "PATIENT") {
    return { error: "Only patients can upload emotion analysis videos" };
  }

  // validate content type to prevent arbitrary file uploads
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return { error: "Invalid video format. Accepted: MP4, WebM, MOV, AVI" };
  }

  // unique object key using userId + timestamp to prevent overwrites
  // and keep files organized per patient in the s3 bucket
  const fileKey = `mer-videos/${session.user.id}-${Date.now()}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileKey,
    ContentType: contentType,
  });

  try {
    // 60 second expiry — enough time for the browser to initiate the upload
    // but short enough to limit exposure if the url is leaked
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    return { success: true, signedUrl, fileKey };
  } catch {
    return { error: "Failed to generate upload URL. Please try again." };
  }
}
