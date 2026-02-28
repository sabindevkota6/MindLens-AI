"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getCounselorAvailableSlots,
  getCounselorAvailableDates,
  bookAppointment,
  type AvailableSlot,
} from "@/lib/actions/counselor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counselorId: string;
  counselorName: string;
  hourlyRate: number;
}

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function BookingDialog({
  open,
  onOpenChange,
  counselorId,
  counselorName,
  hourlyRate,
}: BookingDialogProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);

  // Fetch available dates when month changes
  const fetchAvailableDates = useCallback(async () => {
    setLoadingDates(true);
    const dates = await getCounselorAvailableDates(counselorId, currentMonth, currentYear);
    setAvailableDates(dates);
    setLoadingDates(false);
  }, [counselorId, currentMonth, currentYear]);

  useEffect(() => {
    if (open) {
      fetchAvailableDates();
      setSelectedDate(null);
      setSlots([]);
      setSelectedSlot(null);
      setResult(null);
    }
  }, [open, fetchAvailableDates]);

  // Fetch slots when date is selected
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    getCounselorAvailableSlots(counselorId, selectedDate.toISOString()).then(
      (data) => {
        setSlots(data);
        setLoadingSlots(false);
      }
    );
  }, [selectedDate, counselorId]);

  const handleBook = () => {
    if (!selectedSlot) return;
    startTransition(async () => {
      const res = await bookAppointment(selectedSlot);
      setResult(res);
      if (res.success) {
        // Refresh slots after booking
        if (selectedDate) {
          const updatedSlots = await getCounselorAvailableSlots(
            counselorId,
            selectedDate.toISOString()
          );
          setSlots(updatedSlots);
          setSelectedSlot(null);
        }
      }
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1);
  // Adjust so Monday = 0
  const startDayIndex = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateAvailable = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return availableDates.includes(dateStr);
  };

  const isDatePast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    const t = new Date();
    return day === t.getDate() && currentMonth === t.getMonth() && currentYear === t.getFullYear();
  };

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const canGoPrev = !(currentMonth === now.getMonth() && currentYear === now.getFullYear());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col lg:flex-row min-h-[520px]">
          {/* Left panel - info */}
          <div className="w-full lg:w-64 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 p-6 flex flex-col shrink-0">
            <DialogHeader className="text-left space-y-1 mb-6">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Book a Session
              </DialogTitle>
              <p className="text-sm text-gray-500">
                with {counselorName}
              </p>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>60 min session</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span>Video conferencing</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-lg font-semibold text-gray-900">
                  Rs. {hourlyRate}
                </span>
                <span className="text-gray-400">/session</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-auto pt-4">
              Meeting link will be provided upon confirmation.
            </p>
          </div>

          {/* Right panel - calendar + slots */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Calendar */}
            <div className="flex-1 min-w-[320px] p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Select a Date & Time</h3>

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevMonth}
                  disabled={!canGoPrev || loadingDates}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium text-sm text-gray-900">
                  {MONTHS[currentMonth]} {currentYear}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextMonth}
                  disabled={loadingDates}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium py-1 text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {loadingDates ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells for offset */}
                  {Array.from({ length: startDayIndex }, (_, i) => (
                    <div key={`empty-${i}`} className="h-9" />
                  ))}
                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const available = isDateAvailable(day);
                    const past = isDatePast(day);
                    const selected = isDateSelected(day);
                    const todayDate = isToday(day);

                    return (
                      <button
                        key={day}
                        disabled={past || !available}
                        onClick={() => {
                          setSelectedDate(new Date(currentYear, currentMonth, day));
                          setResult(null);
                        }}
                        className={cn(
                          "h-9 w-full rounded-full text-sm font-medium transition-colors",
                          selected
                            ? "bg-primary text-white"
                            : available && !past
                            ? "text-primary bg-primary/10 hover:bg-primary/20"
                            : past
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-400 cursor-not-allowed",
                          todayDate && !selected && "ring-1 ring-primary"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Time Slots */}
            <div className="w-full lg:w-48 p-6 overflow-y-auto max-h-[350px] lg:max-h-none shrink-0">
              {!selectedDate ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <CalendarDays className="w-8 h-8 mb-2" />
                  <p className="text-sm">Select a date to see available times</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    {formatSelectedDate()}
                  </p>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center mt-8">
                      No available slots for this date
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => {
                            setSelectedSlot(slot.id);
                            setResult(null);
                          }}
                          className={cn(
                            "w-full py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors",
                            selectedSlot === slot.id
                              ? "bg-primary text-white border-primary"
                              : "border-primary/30 text-primary hover:bg-primary/5"
                          )}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          <div>
            {result?.success && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {result.success}
              </p>
            )}
            {result?.error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
                <AlertCircle className="w-4 h-4" />
                {result.error}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              disabled={!selectedSlot || isPending}
              className="px-6"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
