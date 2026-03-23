"use client";

import { useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DownloadState = "idle" | "loading" | "error" | "success";

export function EmotionReportDownloadButton({ logId }: { logId: string }) {
  const [state, setState] = useState<DownloadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const download = useCallback(async () => {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/patient/emotion-report/${logId}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        if (res.status === 401) {
          setErrorMsg("Your session expired. Sign in again to download.");
        } else if (res.status === 404) {
          setErrorMsg("Report not found or no longer available.");
        } else {
          setErrorMsg("Download failed. Please try again.");
        }
        setState("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindlens-emotion-report-${logId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState("success");
      window.setTimeout(() => setState("idle"), 2500);
    } catch {
      setErrorMsg("Network error. Check your connection.");
      setState("error");
    }
  }, [logId]);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl border-primary/30"
        disabled={state === "loading"}
        onClick={download}
      >
        {state === "loading" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Download report
      </Button>
      {state === "error" && (
        <p className="text-xs text-red-600 text-right max-w-[220px]">{errorMsg}</p>
      )}
      {state === "success" && (
        <p className="text-xs text-primary font-medium">Download started.</p>
      )}
    </div>
  );
}
