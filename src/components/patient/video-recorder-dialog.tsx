"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getMerUploadUrl, processEmotionAnalysis } from "@/lib/actions/mer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  Square,
  RotateCcw,
  Upload,
  Lightbulb,
  VolumeX,
  User,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";

const MAX_DURATION = 120; // 2 minutes in seconds
const MAX_FILE_SIZE_MB = 50;
const ACCEPTED_VIDEO_TYPES = ".mp4,.webm,.mov,.avi";

export function VideoRecorderDialog() {
  const [open, setOpen] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [mode, setMode] = useState<"choose" | "record" | "upload">("choose");
  const [timeLeft, setTimeLeft] = useState(MAX_DURATION);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recStatus, setRecStatus] = useState<
    "idle" | "recording" | "stopped"
  >("idle");
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobUrlRef = useRef<string | null>(null);

  // initialize camera when entering record mode
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch {
      setError("Could not access camera. Please check permissions.");
    }
  }, []);

  // start camera when entering record mode
  useEffect(() => {
    if (mode === "record" && !streamRef.current) {
      initCamera();
    }
  }, [mode, initCamera]);

  // single interval per recording session — auto-stops when time runs out
  useEffect(() => {
    if (recStatus !== "recording") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          recorderRef.current?.stop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // stop camera and free resources
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  // helper to revoke the current blob url
  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  // reset all state when dialog closes
  const handleOpenChange = useCallback(
    (val: boolean) => {
      setOpen(val);
      if (!val) {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
        stopCamera();
        revokeBlobUrl();
        setHasAgreed(false);
        setMode("choose");
        setTimeLeft(MAX_DURATION);
        setError(null);
        setUploadedFile(null);
        setIsSubmitting(false);
        setRecStatus("idle");
        setRecordedBlobUrl(null);
        chunksRef.current = [];
        recorderRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [stopCamera, revokeBlobUrl],
  );

  const handleStartRecording = useCallback(() => {
    if (!streamRef.current) return;
    setError(null);
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setRecordedBlobUrl(url);
      setRecStatus("stopped");

      // fix webm duration metadata — seek to infinity forces browser to resolve real duration
      requestAnimationFrame(() => {
        const el = playbackRef.current;
        if (!el) return;
        el.currentTime = Number.MAX_SAFE_INTEGER;
        const onSeeked = () => {
          el.removeEventListener("seeked", onSeeked);
          el.currentTime = 0;
        };
        el.addEventListener("seeked", onSeeked);
      });
    };

    recorder.start(1000);
    recorderRef.current = recorder;
    setRecStatus("recording");
    setTimeLeft(MAX_DURATION);
  }, []);

  const handleStopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  const handleRetake = useCallback(() => {
    revokeBlobUrl();
    setRecordedBlobUrl(null);
    setRecStatus("idle");
    setTimeLeft(MAX_DURATION);
    setError(null);
    chunksRef.current = [];
    recorderRef.current = null;
    // stream is still alive — video element is always mounted so preview resumes
  }, [revokeBlobUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setUploadedFile(file);
    setError(null);
  };

  // uploads the video to s3 via presigned url, then triggers analysis
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      let videoFile: File;

      if (mode === "record" && recordedBlobUrl) {
        // convert the in-memory blob url to an actual file object
        const blob = await fetch(recordedBlobUrl).then((r) => r.blob());
        videoFile = new File([blob], "emotion_recording.webm", {
          type: "video/webm",
        });
      } else if (mode === "upload" && uploadedFile) {
        videoFile = uploadedFile;
      } else {
        return;
      }

      // request a presigned url from the server action
      const urlResponse = await getMerUploadUrl(videoFile.type);

      if ("error" in urlResponse) {
        setError(urlResponse.error);
        return;
      }

      // upload directly to s3 — bypasses next.js server completely
      const uploadRes = await fetch(urlResponse.signedUrl, {
        method: "PUT",
        body: videoFile,
        headers: { "Content-Type": videoFile.type },
      });

      if (!uploadRes.ok) {
        throw new Error("S3 upload failed");
      }

      // trigger hume ai emotion analysis pipeline
      const analysisResult = await processEmotionAnalysis(urlResponse.fileKey);

      if ("error" in analysisResult) {
        setError(analysisResult.error);
        return;
      }

    } catch {
      setError("Failed to upload video. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRecorded = recStatus === "stopped" && !!recordedBlobUrl;
  const canSubmit =
    (mode === "record" && isRecorded) || (mode === "upload" && !!uploadedFile);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-[#00695C] text-white rounded-xl px-9 py-5 text-base font-semibold gap-2.5 shadow-[0_12px_24px_rgba(0,121,107,0.19)]">
          <div className="w-4 h-4 rounded-full border-2 border-white" />
          Start Recording
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-lg">
            AI Emotion Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* disclaimer with agreement checkbox */}
          <div className="bg-[#eef8f5] border border-[#bfe6dc] rounded-xl px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="text-[13px] text-[#2c5c55] leading-relaxed">
                  <span className="font-semibold">Medical Disclaimer:</span>{" "}
                  This tool is for self-awareness only and does not provide a
                  medical diagnosis. Video is analyzed in real-time and never
                  stored.
                </p>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={hasAgreed}
                    onCheckedChange={(checked) =>
                      setHasAgreed(checked === true)
                    }
                    disabled={recStatus === "recording"}
                    className="border-[#2c5c55] data-[state=checked]:bg-[#2c5c55] data-[state=checked]:border-[#2c5c55]"
                  />
                  <span className="text-[13px] font-medium text-[#2c5c55]">
                    I understand and agree to proceed.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* error alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* mode selection - always visible, disabled until agreed */}
          {mode === "choose" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => hasAgreed && setMode("record")}
                disabled={!hasAgreed}
                className={`flex flex-col items-center gap-3 rounded-xl border p-5 transition-colors ${
                  hasAgreed
                    ? "border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/[0.03] cursor-pointer"
                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    Record Video
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Use your camera
                  </p>
                </div>
              </button>
              <button
                onClick={() => hasAgreed && setMode("upload")}
                disabled={!hasAgreed}
                className={`flex flex-col items-center gap-3 rounded-xl border p-5 transition-colors ${
                  hasAgreed
                    ? "border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/[0.03] cursor-pointer"
                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    Upload Video
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    From your device
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* record mode */}
          {hasAgreed && mode === "record" && (
            <div className="space-y-4">
              {/* environment guidelines overlay when idle */}
              {recStatus === "idle" && !recordedBlobUrl && (
                <div className="flex items-center justify-center gap-5 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Good Lighting
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <VolumeX className="w-3.5 h-3.5 text-blue-500" />
                    Quiet Space
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="w-3.5 h-3.5 text-primary" />
                    Face Visible
                  </div>
                </div>
              )}

              {/* video container */}
              <Card className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden border-0">
                {/* live camera preview — always mounted, hidden when showing recorded playback */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity ${
                    recordedBlobUrl
                      ? "hidden"
                      : recStatus === "idle"
                        ? "opacity-60"
                        : "opacity-100"
                  }`}
                />

                {/* recorded video playback */}
                {recordedBlobUrl && (
                  <video
                    ref={playbackRef}
                    src={recordedBlobUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}

                {/* recording timer badge */}
                {recStatus === "recording" && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full font-mono text-xs flex items-center gap-2 shadow-md animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    {formatTime(timeLeft)} / 02:00
                  </div>
                )}

                {/* idle camera off state */}
                {recStatus === "idle" && !cameraReady && !recordedBlobUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
                    <Video className="w-10 h-10" />
                    <p className="text-sm">Camera preview will appear here</p>
                  </div>
                )}
              </Card>

              {/* recording controls */}
              <div className="flex justify-center gap-3">
                {recStatus === "idle" && cameraReady && !recordedBlobUrl && (
                  <Button
                    onClick={handleStartRecording}
                    className="bg-primary hover:bg-[#00695C] text-white rounded-xl px-6 py-5 text-sm font-semibold gap-2"
                  >
                    <div className="w-3 h-3 rounded-full border-2 border-white" />
                    Start Recording
                  </Button>
                )}

                {recStatus === "recording" && (
                  <Button
                    onClick={handleStopRecording}
                    variant="destructive"
                    className="rounded-xl px-6 py-5 text-sm font-semibold gap-2"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Stop Recording
                  </Button>
                )}

                {isRecorded && (
                  <Button
                    onClick={handleRetake}
                    variant="outline"
                    className="rounded-xl px-5 py-5 text-sm gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retake
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* upload mode */}
          {hasAgreed && mode === "upload" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/[0.03] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES}
                  className="hidden"
                  onChange={handleFileChange}
                />
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {uploadedFile.name}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500">
                      Click to select a video file
                    </p>
                    <p className="text-xs text-gray-400">
                      MP4, WebM, MOV or AVI — max {MAX_FILE_SIZE_MB}MB, up to 2
                      minutes
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* submit and back controls */}
          {hasAgreed && mode !== "choose" && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (recorderRef.current?.state === "recording") {
                      recorderRef.current.stop();
                    }
                    stopCamera();
                    revokeBlobUrl();
                    setMode("choose");
                    setError(null);
                    setUploadedFile(null);
                    setRecordedBlobUrl(null);
                    setRecStatus("idle");
                    setTimeLeft(MAX_DURATION);
                    chunksRef.current = [];
                    recorderRef.current = null;
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Back to options
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="bg-primary hover:bg-[#00695C] text-white rounded-xl px-6 py-5 text-sm font-semibold gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {isSubmitting ? "Uploading & Analyzing..." : "Analyze Emotions"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
