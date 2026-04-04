"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EMOTION_COLORS, EMOTION_LIGHT_BG } from "@/lib/emotion-report-constants";
import { EmotionReportPicker } from "@/components/patient/emotion-report-picker";
import {
  Sparkles,
  MessageCircle,
  BarChart3,
  Paperclip,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EmotionLogSummary = {
  id: string;
  dominantEmotion: string;
  recordedAt: Date;
};

interface PreSessionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counselorName: string;
  onProceedToPayment: (data: { medicalConcern?: string; emotionLogId?: string }) => void;
}

export function PreSessionDetailsDialog({
  open,
  onOpenChange,
  counselorName,
  onProceedToPayment,
}: PreSessionDetailsDialogProps) {
  const [medicalConcern, setMedicalConcern] = useState("");
  const [selectedEmotionLog, setSelectedEmotionLog] = useState<EmotionLogSummary | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // reset fields whenever the dialog opens fresh
  useEffect(() => {
    if (open) {
      setMedicalConcern("");
      setSelectedEmotionLog(null);
    }
  }, [open]);

  const handleProceed = (skipOptionals: boolean) => {
    const concern = skipOptionals ? undefined : (medicalConcern.trim() || undefined);
    const emotionLogId = skipOptionals ? undefined : selectedEmotionLog?.id;
    onOpenChange(false);
    onProceedToPayment({ medicalConcern: concern, emotionLogId });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">

          {/* compact horizontal header */}
          <div className="bg-gradient-to-r from-[#00796B] to-[#00897B] px-6 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-white leading-tight">
                Help {counselorName} prepare for you
              </DialogTitle>
              <p className="text-xs text-white/70 mt-0.5">
                These optional details let your counselor walk in already understanding your needs.
              </p>
            </div>
          </div>

          {/* two-column card layout */}
          <div className="grid grid-cols-2 gap-4 px-6 pt-5 pb-4 min-w-0">

            {/* left — medical concern */}
            <div className="min-w-0 rounded-xl border border-teal-100 bg-teal-50/40 p-4 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 text-teal-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">What's on your mind?</p>
                  <p className="text-xs text-gray-400">for your counselor</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Describe what you'd like to work through — even a few words help your counselor come prepared to support you.
              </p>
              <Textarea
                placeholder="e.g. I've been struggling with anxiety at work and could use help managing stress..."
                maxLength={500}
                value={medicalConcern}
                onChange={(e) => setMedicalConcern(e.target.value)}
                rows={4}
                className="text-sm resize-none bg-white border-teal-200 focus-visible:ring-teal-500 placeholder:text-gray-400 flex-1"
              />
              {medicalConcern.length > 0 && (
                <p className="text-xs text-gray-400 text-right mt-1.5">
                  {medicalConcern.length} / 500
                </p>
              )}
            </div>

            {/* right — emotion report */}
            <div className="min-w-0 rounded-xl border border-violet-100 bg-violet-50/40 p-4 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 text-violet-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">Share your emotion analysis</p>
                  <p className="text-xs text-gray-400">PDF sent to counselor</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Attach a report from your MindLens emotion tests to give your counselor a deeper look at how you've been feeling lately.
              </p>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                  {selectedEmotionLog ? (
                    // chip showing the selected report
                    <div
                      className="flex w-full min-w-0 max-w-full items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
                      style={{
                        backgroundColor: EMOTION_LIGHT_BG[selectedEmotionLog.dominantEmotion] ?? "#f8fafc",
                        borderColor: EMOTION_COLORS[selectedEmotionLog.dominantEmotion] ?? "#94a3b8",
                        color: EMOTION_COLORS[selectedEmotionLog.dominantEmotion] ?? "#94a3b8",
                      }}
                    >
                      <Paperclip className="w-3 h-3 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {selectedEmotionLog.dominantEmotion} report attached
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedEmotionLog(null)}
                        className="shrink-0 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                        aria-label="remove attachment"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPickerOpen(true)}
                      className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 gap-1.5 text-xs h-8"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Attach a Report
                    </Button>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  Haven&apos;t taken a test yet?{" "}
                  <a
                    href="/dashboard/patient/emotion-test"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-500 hover:text-violet-700 underline underline-offset-2"
                  >
                    Take one now
                  </a>
                  {" "}— it only takes a minute.
                </p>
              </div>
            </div>

          </div>

          {/* footer */}
          <div className="px-6 pb-5 flex items-center justify-between">
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Both sections are optional — feel free to skip and book directly.
            </p>
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 px-4"
                onClick={() => handleProceed(true)}
              >
                Skip to Payment
              </Button>
              <Button
                size="sm"
                className="gap-1.5 px-5"
                onClick={() => handleProceed(false)}
              >
                Continue to Payment
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>

      <EmotionReportPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={setSelectedEmotionLog}
      />
    </>
  );
}
