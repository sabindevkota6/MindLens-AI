"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// s3 client using env credentials — same setup as s3-verification.ts
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

// get a presigned put url for uploading profile picture directly to s3
export async function getProfilePictureUploadUrl(
  contentType: string
): Promise<{ signedUrl: string; fileKey: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const allowed = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowed.includes(contentType)) {
    return { error: "Only JPEG and PNG images are allowed." };
  }

  const ext = contentType === "image/png" ? "png" : "jpg";
  // key scoped to the user so only they can own this path
  const fileKey = `profiles/${session.user.id}-${Date.now()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: contentType,
  });

  try {
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    return { signedUrl, fileKey };
  } catch {
    return { error: "Failed to generate upload URL. Please try again." };
  }
}

// save the new profile picture url into user.image and invalidate cached paths
export async function saveProfilePicture(
  fileKey: string
): Promise<{ success: true; imageUrl: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // validate the key belongs to this user before saving
  const expectedPrefix = `profiles/${session.user.id}-`;
  if (!fileKey.startsWith(expectedPrefix)) {
    return { error: "Invalid file key." };
  }

  const imageUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    // revalidate all surfaces where the profile image appears
    revalidatePath("/dashboard/counselor/profile");
    revalidatePath("/dashboard/counselor/profile/edit");
    revalidatePath("/dashboard/counselor/onboarding");
    revalidatePath("/dashboard/patient/profile");
    revalidatePath("/dashboard/patient/profile/edit");
    revalidatePath("/dashboard/patient/onboarding");

    return { success: true, imageUrl };
  } catch {
    return { error: "Failed to save profile picture. Please try again." };
  }
}

// remove profile picture — deletes from s3 (best-effort) and clears user.image
export async function removeProfilePicture(): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // fetch current image url so we can attempt s3 cleanup
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    if (user?.image) {
      try {
        // extract s3 key from url and delete from bucket
        const url = new URL(user.image);
        const fileKey = url.pathname.slice(1); // strip leading /
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }));
      } catch {
        // s3 deletion failure is non-fatal — proceed to clear db record
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    revalidatePath("/dashboard/counselor/profile");
    revalidatePath("/dashboard/counselor/profile/edit");
    revalidatePath("/dashboard/counselor/onboarding");
    revalidatePath("/dashboard/patient/profile");
    revalidatePath("/dashboard/patient/profile/edit");
    revalidatePath("/dashboard/patient/onboarding");

    return { success: true };
  } catch {
    return { error: "Failed to remove profile picture." };
  }
}
