import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  // optional metadata — use href to make the notification clickable
  data?: Record<string, unknown>;
};

// creates a single notification row for a user — call fire-and-forget with .catch(console.error)
export async function createNotification({
  userId,
  type,
  title,
  body,
  data,
}: CreateNotificationInput) {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data ?? undefined,
    },
  });
}

// creates notifications for multiple users at once using a single db round-trip
export async function createNotifications(
  items: CreateNotificationInput[]
) {
  if (items.length === 0) return;
  await prisma.notification.createMany({
    data: items.map(({ userId, type, title, body, data }) => ({
      userId,
      type,
      title,
      body,
      data: data ?? undefined,
    })),
  });
}
