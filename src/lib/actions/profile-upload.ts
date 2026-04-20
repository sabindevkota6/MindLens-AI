"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// s3 client for profile picture uploads and deletions
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

// generates a presigned put url so the browser can upload the image directly to s3
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
  // file key is scoped to the user id so each user can only own their own path
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

// saves the uploaded image url to the user record and refreshes all pages that show the avatar
export async function saveProfilePicture(
  fileKey: string
): Promise<{ success: true; imageUrl: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // make sure the file key belongs to this user before writing it to the database
  const expectedPrefix = `profiles/${session.user.id}-`;
  if (!fileKey.startsWith(expectedPrefix)) {
    return { error: "Invalid file key." };
  }

  const imageUrl = `https://${BUCKET}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${fileKey}`;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    // revalidate every page that shows the profile avatar so they pick up the new image
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

// removes the profile picture by trying to delete the file from s3 then clears the url in the database
export async function removeProfilePicture(): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // fetch the current image url so we know which s3 object to delete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    if (user?.image) {
      try {
        // parse the s3 key out of the stored url and send the delete command
        const url = new URL(user.image);
        const fileKey = url.pathname.slice(1); // strip the leading slash
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }));
      } catch {
        // s3 deletion is best-effort, we still clear the db record even if it fails
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
