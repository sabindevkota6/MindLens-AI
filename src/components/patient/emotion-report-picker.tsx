"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getEmotionHistory } from "@/lib/actions/history";
import { EMOTION_COLORS, EMOTION_LIGHT_BG } from "@/lib/emotion-report-constants";
import { Loader2, FileBarChart, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type EmotionLogSummary = {
  id: string;
  dominantEmotion: string;
  recordedAt: Date;
};

interface EmotionReportPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (log: EmotionLogSummary) => void;
}

export function EmotionReportPicker({
  open,
  onOpenChange,
  onSelect,
}: EmotionReportPickerProps) {
  const [logs, setLogs] = useState<EmotionLogSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // fetch the patient's emotion history each time the picker opens
  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setLoading(true);
    getEmotionHistory().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [open]);

  const handleAttach = () => {
    const log = logs.find((l) => l.id === selectedId);
    if (!log) return;
    onSelect(log);
    onOpenChange(false);
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">

        {/* header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Select an emotion report
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Pick the report that best reflects how you&apos;ve been feeling. Your counselor will receive it as a PDF attachment.
          </p>
        </div>

        {/* list area */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <FileBarChart className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No reports yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px] leading-relaxed">
                Take an emotion analysis test first and your reports will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto -mx-1 px-1">
              {logs.map((log, index) => {
                const color = EMOTION_COLORS[log.dominantEmotion] ?? "#94a3b8";
                const bg = EMOTION_LIGHT_BG[log.dominantEmotion] ?? "#f8fafc";
                const isSelected = selectedId === log.id;
                // session number counting from most recent
                const sessionNum = logs.length - index;

                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedId(log.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/80"
                    )}
                  >
                    {/* colored session badge */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ backgroundColor: bg, color }}
                    >
                      #{sessionNum}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {log.dominantEmotion}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(log.recordedAt)} · {formatTime(log.recordedAt)}
                      </p>
                    </div>

                    {/* selected checkmark */}
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* footer buttons */}
        <div className="px-5 pb-5 flex items-center gap-2.5">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleAttach}
            disabled={!selectedId}
          >
            Attach Report
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
