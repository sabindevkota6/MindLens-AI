"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface VideoCallProps {
  meetingUrl: string;
  appointmentId: string;
  role: "PATIENT" | "COUNSELOR";
}

export function VideoCall({ meetingUrl, role }: VideoCallProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const dashboardPath = role === "PATIENT"
    ? "/dashboard/patient/appointments"
    : "/dashboard/counselor/appointments";

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Link href={dashboardPath}>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Appointments
            </Button>
          </Link>
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
        <iframe
          ref={iframeRef}
          src={meetingUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
