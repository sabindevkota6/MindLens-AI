"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// how many notifications to return per fetch
const LIMIT = 30;

// fetch the latest notifications for the current user plus the unread count
export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  return { notifications, unreadCount };
}

// mark a single notification as read — ignores if it doesn't belong to the user
export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });

  return { success: true };
}

// mark every unread notification for the current user as read
export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return { success: true };
}

// delete a single notification
export async function deleteNotification(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.deleteMany({
    where: { id: notificationId, userId: session.user.id },
  });

  return { success: true };
}

// delete all notifications for the current user
export async function clearAllNotifications() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.deleteMany({
    where: { userId: session.user.id },
  });

  return { success: true };
}
