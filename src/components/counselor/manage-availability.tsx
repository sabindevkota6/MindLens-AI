"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Unlock,
  User,
  CalendarCheck,
  Loader2,
  CalendarX,
} from "lucide-react";
import {
  getAvailabilitySlots,
  toggleSlotBlock,
  type ManagedSlot,
} from "@/lib/actions/counselor";
import { cn } from "@/lib/utils";

interface ManageAvailabilityProps {
  initialSlots: ManagedSlot[];
  initialWeekStart: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function ManageAvailability({
  initialSlots,
  initialWeekStart,
}: ManageAvailabilityProps) {
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart));
  const [slots, setSlots] = useState<ManagedSlot[]>(initialSlots);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const weekLabel = `${formatDateShort(weekStart)} – ${formatDateShort(weekEnd)}, ${weekEnd.getFullYear()}`;

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, { date: Date; slots: ManagedSlot[] }>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      grouped.set(key, { date: new Date(date), slots: [] });
    }

    slots.forEach((slot) => {
      const d = new Date(slot.startTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (grouped.has(key)) {
        grouped.get(key)!.slots.push(slot);
      }
    });

    return Array.from(grouped.values());
  }, [slots, weekStart]);

  const fetchSlots = async (start: Date) => {
    setIsLoading(true);
    try {
      const data = await getAvailabilitySlots(start.toISOString());
      setSlots(data);
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  };

  const navigateWeek = (direction: number) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setWeekStart(newStart);
    fetchSlots(newStart);
  };

  const goToToday = () => {
    const today = getWeekStart(new Date());
    setWeekStart(today);
    fetchSlots(today);
  };

  const handleToggleBlock = async (slotId: string) => {
    setActionLoading((prev) => ({ ...prev, [slotId]: true }));

    // Optimistic update
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, isBlocked: !s.isBlocked } : s
      )
    );

    const result = await toggleSlotBlock(slotId);

    if (result.error) {
      // Revert optimistic update
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, isBlocked: !s.isBlocked } : s
        )
      );
    }

    setActionLoading((prev) => ({ ...prev, [slotId]: false }));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isPast = (dateStr: string) => new Date(dateStr) <= new Date();

  const totalSlots = slots.length;
  const availableSlots = slots.filter(
    (s) => !s.isBooked && !s.isBlocked && !isPast(s.startTime)
  ).length;
  const bookedSlots = slots.filter((s) => s.isBooked).length;
  const blockedSlots = slots.filter((s) => s.isBlocked && !isPast(s.startTime)).length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Slots",
            value: totalSlots,
            color: "text-gray-700",
            bg: "bg-white border border-gray-200",
          },
          {
            label: "Available",
            value: availableSlots,
            color: "text-emerald-700",
            bg: "bg-emerald-50 border border-emerald-100",
          },
          {
            label: "Booked",
            value: bookedSlots,
            color: "text-blue-700",
            bg: "bg-blue-50 border border-blue-100",
          },
          {
            label: "Blocked",
            value: blockedSlots,
            color: "text-amber-700",
            bg: "bg-amber-50 border border-amber-100",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("rounded-xl p-4 text-center shadow-sm", stat.bg)}
          >
            <p className={cn("text-2xl font-bold", stat.color)}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Week View Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Manage Slots</CardTitle>
                <CardDescription>
                  View and manage your appointment slots
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="rounded-lg"
            >
              Today
            </Button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mt-4 bg-gray-50 rounded-xl p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek(-1)}
              className="rounded-lg h-9 w-9"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-semibold text-gray-700 text-sm">
              {weekLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek(1)}
              className="rounded-lg h-9 w-9"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading slots...
            </div>
          ) : (
            slotsByDate.map(({ date, slots: daySlots }) => (
              <div
                key={date.toISOString()}
                className={cn(
                  "rounded-xl border overflow-hidden",
                  isToday(date)
                    ? "border-primary/30 bg-primary/[0.02]"
                    : "border-gray-100"
                )}
              >
                {/* Day Header */}
                <div
                  className={cn(
                    "flex items-center justify-between px-5 py-3",
                    isToday(date) ? "bg-primary/5" : "bg-gray-50/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-800 text-sm">
                      {formatDate(date)}
                    </span>
                    {isToday(date) && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary text-[10px] px-1.5 py-0"
                      >
                        Today
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {daySlots.length > 0
                      ? `${daySlots.length} slot${daySlots.length > 1 ? "s" : ""}`
                      : "No slots"}
                  </span>
                </div>

                {/* Slot List */}
                {daySlots.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {daySlots.map((slot) => {
                      const past = isPast(slot.startTime);
                      const loading = actionLoading[slot.id];

                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            "flex items-center justify-between px-5 py-3 transition-colors",
                            past && "opacity-50",
                            slot.isBooked && !past && "bg-blue-50/30",
                            slot.isBlocked && !past && "bg-amber-50/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm font-medium text-gray-700 min-w-[130px]">
                              {formatTime(slot.startTime)} –{" "}
                              {formatTime(slot.endTime)}
                            </span>

                            {past ? (
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-400 text-[10px] px-1.5 py-0"
                              >
                                Past
                              </Badge>
                            ) : slot.isBooked ? (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-1.5 py-0">
                                <User className="w-3 h-3 mr-1" />
                                Booked
                                {slot.patientName
                                  ? ` · ${slot.patientName}`
                                  : ""}
                              </Badge>
                            ) : slot.isBlocked ? (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0">
                                <Lock className="w-3 h-3 mr-1" />
                                Blocked
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0">
                                Available
                              </Badge>
                            )}
                          </div>

                          {!past && !slot.isBooked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                              onClick={() => handleToggleBlock(slot.id)}
                              className={cn(
                                "h-8 text-xs rounded-lg",
                                slot.isBlocked
                                  ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              )}
                            >
                              {loading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : slot.isBlocked ? (
                                <>
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-1.5">
                    <CalendarX className="w-5 h-5" />
                    <span>No availability set for this day</span>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Booked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Blocked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          Past
        </div>
      </div>
    </div>
  );
}
