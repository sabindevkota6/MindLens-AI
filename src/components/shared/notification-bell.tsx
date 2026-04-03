"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import type { NotificationType } from "@prisma/client";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  CheckCircle2,
  Clock,
  Star,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Ban,
  Unlock,
  AlertCircle,
  Trash2,
  X,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/lib/actions/notifications";

// how often to poll for new notifications (ms)
const POLL_INTERVAL = 30_000;

type RawNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  read: boolean;
  createdAt: Date;
};

// metadata per notification type — icon, icon color, icon background
const TYPE_META: Record<
  NotificationType,
  { icon: React.ElementType; iconColor: string; iconBg: string; accentColor: string }
> = {
  APPOINTMENT_BOOKED: {
    icon: CalendarCheck,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50",
    accentColor: "bg-teal-500",
  },
  APPOINTMENT_CANCELLED: {
    icon: CalendarX,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
    accentColor: "bg-rose-500",
  },
  APPOINTMENT_ADJUSTED: {
    icon: CalendarClock,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    accentColor: "bg-amber-500",
  },
  APPOINTMENT_COMPLETED: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    accentColor: "bg-emerald-500",
  },
  APPOINTMENT_REMINDER: {
    icon: Clock,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    accentColor: "bg-blue-500",
  },
  REVIEW_RECEIVED: {
    icon: Star,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    accentColor: "bg-amber-400",
  },
  VERIFICATION_APPROVED: {
    icon: ShieldCheck,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    accentColor: "bg-emerald-500",
  },
  VERIFICATION_REJECTED: {
    icon: ShieldX,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    accentColor: "bg-red-500",
  },
  VERIFICATION_REVOKED: {
    icon: ShieldAlert,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    accentColor: "bg-amber-500",
  },
  ACCOUNT_BANNED: {
    icon: Ban,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    accentColor: "bg-red-500",
  },
  ACCOUNT_UNBANNED: {
    icon: Unlock,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    accentColor: "bg-emerald-500",
  },
  ACCOUNT_SUSPENDED: {
    icon: AlertCircle,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    accentColor: "bg-amber-500",
  },
  ACCOUNT_UNSUSPENDED: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    accentColor: "bg-emerald-500",
  },
};

function NotificationCard({
  notification,
  onRead,
  onDelete,
}: {
  notification: RawNotification;
  onRead: (id: string, href?: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;
  const href = (notification.data as Record<string, unknown> | null)?.href as string | undefined;

  return (
    <div
      onClick={() => onRead(notification.id, href)}
      className={cn(
        "group relative flex gap-3.5 px-4 py-3.5 cursor-pointer transition-colors duration-150",
        notification.read
          ? "hover:bg-gray-50/80"
          : "bg-primary/[0.03] hover:bg-primary/[0.06]"
      )}
    >
      {/* unread left accent bar */}
      {!notification.read && (
        <span className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", meta.accentColor)} />
      )}

      {/* type icon */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5",
          meta.iconBg
        )}
      >
        <Icon className={cn("w-4 h-4", meta.iconColor)} />
      </div>

      {/* content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p
          className={cn(
            "text-sm leading-snug",
            notification.read ? "font-medium text-gray-700" : "font-semibold text-gray-900"
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-gray-400 pt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* delete button — revealed on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-lg hover:bg-gray-200/80 text-gray-400 hover:text-gray-600"
        aria-label="Remove notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RawNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    const result = await getNotifications();
    setNotifications(result.notifications as RawNotification[]);
    setUnreadCount(result.unreadCount);
  }, []);

  // initial fetch on mount
  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  // poll every 30s for new notifications
  useEffect(() => {
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // re-fetch when the panel opens so the user always sees fresh data
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // close when clicking outside the panel or button
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleRead(id: string, href?: string) {
    // optimistically mark as read in local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    startTransition(async () => {
      await markNotificationRead(id);
      if (href) {
        setIsOpen(false);
        router.push(href);
      }
    });
  }

  function handleDelete(id: string) {
    const wasUnread = notifications.find((n) => n.id === id)?.read === false;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));

    startTransition(async () => {
      await deleteNotification(id);
    });
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  function handleClearAll() {
    setNotifications([]);
    setUnreadCount(0);
    startTransition(async () => {
      await clearAllNotifications();
    });
  }

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="relative">
      {/* bell trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "relative w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-150",
          isOpen
            ? "bg-primary/10 text-primary"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />

        {/* unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none shadow-sm">
            {displayCount}
          </span>
        )}
      </button>

      {/* dropdown panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2.5 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100/80 overflow-hidden z-[200]"
          style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.08)" }}
        >
          {/* panel header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* notification list */}
          <div className="overflow-y-auto max-h-[420px] divide-y divide-gray-50">
            {isLoading ? (
              // skeleton loader
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-gray-100 rounded w-3/5" />
                      <div className="h-2.5 bg-gray-100 rounded w-4/5" />
                      <div className="h-2 bg-gray-100 rounded w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // empty state
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">All caught up</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Notifications about your appointments, sessions and account will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {/* panel footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-center">
              <button
                onClick={handleClearAll}
                disabled={isPending}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 transition-colors font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
