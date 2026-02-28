"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Trash2,
  Clock,
  Save,
  Loader2,
  CalendarDays,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { saveRecurringSchedule } from "@/lib/actions/counselor";
import { cn } from "@/lib/utils";

const DAYS = [
  { name: "Sunday", short: "SUN" },
  { name: "Monday", short: "MON" },
  { name: "Tuesday", short: "TUE" },
  { name: "Wednesday", short: "WED" },
  { name: "Thursday", short: "THU" },
  { name: "Friday", short: "FRI" },
  { name: "Saturday", short: "SAT" },
];

// 30-min increments from 00:00 to 23:30
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    );
  }
}

function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  timeBlocks: TimeBlock[];
}

interface SetScheduleFormProps {
  initialSchedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

let blockIdCounter = 0;
const newBlockId = () => `block-${Date.now()}-${++blockIdCounter}`;

export function SetScheduleForm({ initialSchedule }: SetScheduleFormProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(() =>
    DAYS.map((_, i) => {
      const blocks = initialSchedule
        .filter((s) => s.dayOfWeek === i)
        .map((s) => ({
          id: newBlockId(),
          startTime: s.startTime,
          endTime: s.endTime,
        }));
      return {
        dayOfWeek: i,
        enabled: blocks.length > 0,
        timeBlocks:
          blocks.length > 0
            ? blocks
            : [{ id: newBlockId(), startTime: "09:00", endTime: "17:00" }],
      };
    })
  );

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Live validation
  const errors = useMemo(() => {
    const errs = new Map<string, string>();
    schedule.forEach((day) => {
      if (!day.enabled) return;
      day.timeBlocks.forEach((block, i) => {
        const [sh, sm] = block.startTime.split(":").map(Number);
        const [eh, em] = block.endTime.split(":").map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;

        if (endMins <= startMins) {
          errs.set(`${day.dayOfWeek}-${i}`, "End time must be after start time");
        } else if (endMins - startMins < 60) {
          errs.set(`${day.dayOfWeek}-${i}`, "Block must be at least 1 hour");
        }

        // Overlap check
        for (let j = 0; j < day.timeBlocks.length; j++) {
          if (j === i) continue;
          const other = day.timeBlocks[j];
          const [oSh, oSm] = other.startTime.split(":").map(Number);
          const [oEh, oEm] = other.endTime.split(":").map(Number);
          const oStart = oSh * 60 + oSm;
          const oEnd = oEh * 60 + oEm;
          if (startMins < oEnd && endMins > oStart) {
            errs.set(`${day.dayOfWeek}-${i}`, "Overlapping time blocks");
          }
        }
      });
    });
    return errs;
  }, [schedule]);

  const hasErrors = errors.size > 0;
  const hasEnabledDays = schedule.some((d) => d.enabled);

  const toggleDay = (dayIdx: number) => {
    setSchedule((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, enabled: !d.enabled } : d))
    );
    setMessage(null);
  };

  const updateTime = (
    dayIdx: number,
    blockIdx: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              timeBlocks: d.timeBlocks.map((b, j) =>
                j === blockIdx ? { ...b, [field]: value } : b
              ),
            }
          : d
      )
    );
    setMessage(null);
  };

  const addTimeBlock = (dayIdx: number) => {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              timeBlocks: [
                ...d.timeBlocks,
                { id: newBlockId(), startTime: "13:00", endTime: "17:00" },
              ],
            }
          : d
      )
    );
    setMessage(null);
  };

  const removeTimeBlock = (dayIdx: number, blockIdx: number) => {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, timeBlocks: d.timeBlocks.filter((_, j) => j !== blockIdx) }
          : d
      )
    );
    setMessage(null);
  };

  const handleSave = () => {
    if (hasErrors) return;
    setMessage(null);

    startTransition(async () => {
      const result = await saveRecurringSchedule({
        schedule: schedule.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          enabled: d.enabled,
          timeBlocks: d.enabled
            ? d.timeBlocks.map((b) => ({
                startTime: b.startTime,
                endTime: b.endTime,
              }))
            : [],
        })),
      });

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({
          type: "success",
          text: result.success || "Schedule saved!",
        });
      }
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Weekly Schedule</CardTitle>
            <CardDescription>
              Set your regular working hours. One-hour appointment slots will be
              automatically generated for the next 4 weeks.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {schedule.map((day, dayIdx) => (
          <div
            key={day.dayOfWeek}
            className={cn(
              "rounded-xl border transition-all duration-200",
              day.enabled
                ? "border-primary/20 bg-primary/[0.02] shadow-sm"
                : "border-gray-100 bg-gray-50/50"
            )}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-md tracking-wider",
                    day.enabled
                      ? "bg-primary/10 text-primary"
                      : "bg-gray-200/60 text-gray-400"
                  )}
                >
                  {DAYS[dayIdx].short}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    day.enabled ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {DAYS[dayIdx].name}
                </span>
              </div>

              <Switch
                checked={day.enabled}
                onCheckedChange={() => toggleDay(dayIdx)}
              />
            </div>

            {/* Time Blocks */}
            {day.enabled && (
              <div className="px-5 pb-4 space-y-3">
                <Separator className="mb-3" />

                {day.timeBlocks.map((block, blockIdx) => {
                  const error = errors.get(`${day.dayOfWeek}-${blockIdx}`);
                  return (
                    <div key={block.id}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />

                        <Select
                          value={block.startTime}
                          onValueChange={(val) =>
                            updateTime(dayIdx, blockIdx, "startTime", val)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "w-[130px] bg-white",
                              error && "border-red-300 focus:ring-red-200"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {formatTimeDisplay(t)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <span className="text-gray-400 font-medium text-sm">
                          to
                        </span>

                        <Select
                          value={block.endTime}
                          onValueChange={(val) =>
                            updateTime(dayIdx, blockIdx, "endTime", val)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "w-[130px] bg-white",
                              error && "border-red-300 focus:ring-red-200"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {formatTimeDisplay(t)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {day.timeBlocks.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                            onClick={() => removeTimeBlock(dayIdx, blockIdx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {error && (
                        <p className="text-xs text-red-500 mt-1.5 ml-7 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 hover:bg-primary/5 ml-7"
                  onClick={() => addTimeBlock(dayIdx)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add time block
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Messages */}
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className={
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : ""
            }
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 !text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isPending || hasErrors || !hasEnabledDays}
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating slots...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Schedule & Generate Slots
              </>
            )}
          </Button>
          {!hasEnabledDays && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Enable at least one day to save your schedule
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
