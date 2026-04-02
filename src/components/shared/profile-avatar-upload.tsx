"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Camera,
  Upload,
  ImageOff,
  Loader2,
  X,
  AlertCircle,
  FolderOpen,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getProfilePictureUploadUrl,
  saveProfilePicture,
  removeProfilePicture,
} from "@/lib/actions/profile-upload";
import { cn } from "@/lib/utils";

// ─── types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";

type ProfileAvatarUploadProps = {
  currentImage?: string | null;
  initials: string;
  size?: Size;
  onUploadComplete?: (url: string) => void;
  onRemoveComplete?: () => void;
};

// ─── size maps ────────────────────────────────────────────────────────────────

const AVATAR_SIZE: Record<Size, string> = {
  sm: "w-16 h-16",
  md: "w-28 h-28",
  lg: "w-36 h-36",
};

const BADGE_SIZE: Record<Size, string> = {
  sm: "w-5 h-5 bottom-0 right-0",
  md: "w-8 h-8 -bottom-1 -right-1",
  lg: "w-10 h-10 -bottom-1 -right-1",
};

const CAMERA_ICON_SIZE: Record<Size, string> = {
  sm: "w-2.5 h-2.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const FALLBACK_TEXT_SIZE: Record<Size, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-3xl",
};

const MAX_BYTES = 2 * 1024 * 1024; // 2 mb
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// ─── component ────────────────────────────────────────────────────────────────

export function ProfileAvatarUpload({
  currentImage,
  initials,
  size = "md",
  onUploadComplete,
  onRemoveComplete,
}: ProfileAvatarUploadProps) {
  const { data: sessionData, update: updateSession } = useSession();
  const liveImage = sessionData?.user?.image ?? currentImage ?? null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // webcam state
  const [webcamActive, setWebcamActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  const isBusy = uploading || removing;

  // assign stream to video element once webcam activates
  useEffect(() => {
    if (webcamActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [webcamActive, stream]);

  // ── file validation and preview ──────────────────────────────────────────

  function processFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG and PNG images are supported.");
      setSelectedFile(null);
      revokePreview();
      setPreviewUrl(null);
      setDialogOpen(true);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 2 MB.");
      setSelectedFile(null);
      revokePreview();
      setPreviewUrl(null);
      setDialogOpen(true);
      return;
    }
    setError(null);
    revokePreview();
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDialogOpen(true);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    processFile(file);
  }

  // drag-and-drop on the avatar trigger
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // ── webcam ───────────────────────────────────────────────────────────────

  async function startWebcam() {
    setWebcamError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: "user" },
      });
      setStream(s);
      setWebcamActive(true);
    } catch {
      setWebcamError("Camera access denied. Please allow camera permissions in your browser.");
    }
  }

  function stopStream() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  // capture current frame from video into canvas, then convert to a File
  function captureFrame() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // square-crop from center so the circular preview looks natural
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    canvas.width = side;
    canvas.height = side;
    canvas.getContext("2d")?.drawImage(video, sx, sy, side, side, 0, 0, side, side);
    stopStream();
    setWebcamActive(false);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelectedFile(file);
        // use data url so the preview survives without a blob url lifetime concern
        setPreviewUrl(canvas.toDataURL("image/jpeg"));
        setError(null);
      },
      "image/jpeg",
      0.92
    );
  }

  function handleBackFromWebcam() {
    stopStream();
    setWebcamActive(false);
    setWebcamError(null);
  }

  // ── upload flow: presigned url → s3 put → db save → session refresh ─────

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    try {
      const urlRes = await getProfilePictureUploadUrl(selectedFile.type);
      if ("error" in urlRes) {
        setError(urlRes.error);
        setUploading(false);
        return;
      }

      const s3Res = await fetch(urlRes.signedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });
      if (!s3Res.ok) {
        setError("Upload to storage failed. Please try again.");
        setUploading(false);
        return;
      }

      const saveRes = await saveProfilePicture(urlRes.fileKey);
      if ("error" in saveRes) {
        setError(saveRes.error);
        setUploading(false);
        return;
      }

      await updateSession({ image: saveRes.imageUrl });

      revokePreview();
      setPreviewUrl(null);
      setSelectedFile(null);
      setDialogOpen(false);
      toast.success("Profile picture updated.");
      onUploadComplete?.(saveRes.imageUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── remove flow ──────────────────────────────────────────────────────────

  async function handleRemove() {
    setRemoving(true);
    setError(null);

    const res = await removeProfilePicture();
    if ("error" in res) {
      setError(res.error);
      setRemoving(false);
      return;
    }

    await updateSession({ image: null });

    setDialogOpen(false);
    setRemoving(false);
    toast.success("Profile picture removed.");
    onRemoveComplete?.();
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  function revokePreview() {
    // only revoke object urls — data urls don't need to be revoked
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }

  function handleChooseDifferent() {
    revokePreview();
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    setWebcamError(null);
  }

  function handleDialogClose(open: boolean) {
    if (isBusy) return;
    if (!open) {
      stopStream();
      setWebcamActive(false);
      setWebcamError(null);
      revokePreview();
      setPreviewUrl(null);
      setSelectedFile(null);
      setError(null);
    }
    setDialogOpen(open);
  }

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFileInputChange}
      />
      {/* hidden canvas used for webcam frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* clickable avatar trigger — click opens dialog with choices */}
      <div
        className="relative inline-block cursor-pointer group"
        onClick={() => setDialogOpen(true)}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label="Change profile picture"
        onKeyDown={(e) => e.key === "Enter" && setDialogOpen(true)}
      >
        <Avatar
          className={cn(
            AVATAR_SIZE[size],
            "border-4 border-slate-200 shadow-lg",
            "ring-0 group-hover:ring-4 group-hover:ring-primary/20 transition-all duration-200"
          )}
        >
          <AvatarImage src={liveImage || ""} alt="Profile picture" />
          <AvatarFallback
            className={cn(
              "bg-primary/10 text-primary font-bold",
              FALLBACK_TEXT_SIZE[size]
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* camera badge — always visible, teal, scale on hover */}
        <div
          className={cn(
            "absolute rounded-full flex items-center justify-center",
            "bg-primary text-white shadow-md",
            "ring-2 ring-white",
            "transition-transform duration-150 group-hover:scale-110",
            BADGE_SIZE[size]
          )}
        >
          <Camera className={CAMERA_ICON_SIZE[size]} />
        </div>
      </div>

      {/* preview + confirm dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent
          className="max-w-sm p-0 overflow-hidden rounded-2xl border-0 shadow-xl gap-0"
          showCloseButton={false}
          onInteractOutside={(e) => isBusy && e.preventDefault()}
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-1">
              {webcamActive && (
                <button
                  onClick={handleBackFromWebcam}
                  className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100 -ml-1 mr-0.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <DialogTitle className="text-base font-semibold text-gray-900">
                {webcamActive ? "Take a photo" : "Profile photo"}
              </DialogTitle>
            </div>
            {!isBusy && !webcamActive && (
              <button
                onClick={() => handleDialogClose(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── webcam capture view ─────────────────────────────────────── */}
          {webcamActive ? (
            <div className="flex flex-col items-center gap-4 px-5 py-6">
              {/* live feed inside a circular mask */}
              <div className="w-64 h-64 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg bg-gray-900 flex-shrink-0">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  // mirror the feed so it feels like a selfie camera
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
              <p className="text-xs text-gray-400">Position your face in the circle, then capture</p>
              <Button
                onClick={captureFrame}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture photo
              </Button>
            </div>
          ) : (
            <>
              {/* ── preview area ─────────────────────────────────────────── */}
              <div className="flex flex-col items-center gap-4 px-5 py-7">
                {/* circular preview — shows selected/captured image or current avatar */}
                {previewUrl ? (
                  <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg flex-shrink-0">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <Avatar className="w-40 h-40 ring-4 ring-gray-100 shadow-lg flex-shrink-0">
                    <AvatarImage src={liveImage || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* selected file metadata */}
                {selectedFile && (
                  <div className="text-center space-y-0.5">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[220px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                )}

                {/* validation / upload error banner */}
                {error && (
                  <div className="flex items-start gap-2.5 w-full px-3 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* ── action buttons ───────────────────────────────────────── */}
              <div className="px-5 pb-6 space-y-2.5">
                {selectedFile ? (
                  <>
                    {/* confirm upload */}
                    <Button
                      onClick={handleUpload}
                      disabled={isBusy}
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload this photo
                        </>
                      )}
                    </Button>
                    {/* go back to choice state — don't close dialog */}
                    <Button
                      variant="outline"
                      onClick={handleChooseDifferent}
                      disabled={isBusy}
                      className="w-full h-11 rounded-xl border-gray-200 text-gray-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Choose different
                    </Button>
                  </>
                ) : (
                  <>
                    {/* primary upload options */}
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-11 rounded-xl border-gray-200 text-gray-700 font-medium"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Choose from files
                    </Button>
                    <Button
                      variant="outline"
                      onClick={startWebcam}
                      className="w-full h-11 rounded-xl border-gray-200 text-gray-700 font-medium"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take a photo
                    </Button>

                    {/* webcam permission error — shown inline under "Take a photo" */}
                    {webcamError && (
                      <div className="flex items-start gap-2.5 w-full px-3 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{webcamError}</span>
                      </div>
                    )}
                  </>
                )}

                {/* remove link — only when user already has a profile picture */}
                {(liveImage || currentImage) && !uploading && (
                  <button
                    onClick={handleRemove}
                    disabled={isBusy}
                    className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors py-2.5 rounded-xl hover:bg-red-50 disabled:opacity-50"
                  >
                    {removing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Removing…
                      </>
                    ) : (
                      <>
                        <ImageOff className="w-3.5 h-3.5" />
                        Remove profile picture
                      </>
                    )}
                  </button>
                )}

                {/* cancel — shown in choice state */}
                {!selectedFile && !removing && (
                  <button
                    onClick={() => handleDialogClose(false)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
