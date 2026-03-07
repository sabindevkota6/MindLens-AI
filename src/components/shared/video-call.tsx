"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Script from "next/script";

interface JitsiApiOptions {
  roomName: string;
  parentNode: HTMLElement;
  width: string;
  height: string;
  jwt: string;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  onload?: () => void;
}

interface JitsiApiInstance {
  addListener?: (event: string, listener: () => void) => void;
  executeCommand?: (command: string) => void;
  dispose?: () => void;
}

interface JitsiApiConstructor {
  new (domain: string, options: JitsiApiOptions): JitsiApiInstance;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiApiConstructor;
  }
}

interface VideoCallProps {
  appId: string;
  domain: string;
  roomName: string;
  jwt: string;
  role: "PATIENT" | "COUNSELOR";
}

export function VideoCall({ appId, domain, roomName, jwt, role }: VideoCallProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApiInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCallEnded, setHasCallEnded] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const isCallActive = !hasCallEnded;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const JitsiApi = window.JitsiMeetExternalAPI;
    if (!JitsiApi && !scriptLoaded) {
      return;
    }

    if (!JitsiApi) {
      return;
    }

    setIsLoading(true);
    setHasCallEnded(false);
    containerRef.current.innerHTML = "";
    apiRef.current?.dispose?.();

    const api = new JitsiApi(domain, {
      roomName: `${appId}/${roomName}`,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      jwt,
      configOverwrite: {
        prejoinPageEnabled: false,
        disableDeepLinking: true,
      },
      onload: () => setIsLoading(false),
    });

    api.addListener?.("videoConferenceLeft", () => {
      setHasCallEnded(true);
      setIsLoading(false);
    });

    api.addListener?.("readyToClose", () => {
      setHasCallEnded(true);
      setIsLoading(false);
    });

    apiRef.current = api;

    const fallbackTimer = setTimeout(() => setIsLoading(false), 3000);

    return () => {
      clearTimeout(fallbackTimer);
      api.dispose?.();
      apiRef.current = null;
    };
  }, [appId, domain, jwt, roomName, scriptLoaded]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isCallActive) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!isCallActive) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;

      event.preventDefault();
      event.stopPropagation();
      setShowExitDialog(true);
    };

    const handlePopState = () => {
      if (!isCallActive) return;
      setShowExitDialog(true);
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isCallActive]);

  const dashboardPath = role === "PATIENT"
    ? "/dashboard/patient/appointments"
    : "/dashboard/counselor/appointments";

  const handleAttemptExit = () => {
    if (isCallActive) {
      setShowExitDialog(true);
      return;
    }

    router.push(dashboardPath);
  };

  const handleHangup = () => {
    apiRef.current?.executeCommand?.("hangup");
    setShowExitDialog(false);
  };

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] flex flex-col bg-gray-950">
      <Script
        src={`https://8x8.vc/${appId}/external_api.js`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onReady={() => setScriptLoaded(true)}
      />

      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800 gap-2" onClick={handleAttemptExit}>
            <ArrowLeft className="w-4 h-4" />
            Back to Appointments
          </Button>
          <div className="w-px h-6 bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300 font-medium">MindLens AI Session</span>
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Connecting to meeting room...</p>
            </div>
          </div>
        )}
        {hasCallEnded && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10 px-6">
            <div className="max-w-md text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center text-3xl">
                ✓
              </div>
              <h2 className="text-2xl font-semibold text-white">Thank you for attending</h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Your session has ended successfully. You can return to your appointments whenever you are ready.
              </p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Meeting in progress</DialogTitle>
            <DialogDescription>
              Please hang up to exit this view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleHangup} className="bg-red-600 hover:bg-red-700 text-white">
              Hang up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
