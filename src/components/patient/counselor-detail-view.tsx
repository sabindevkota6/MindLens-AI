"use client";

import { useState } from "react";
import type { CounselorDetail } from "@/lib/actions/counselor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookingDialog } from "@/components/patient/booking-dialog";
import { cn } from "@/lib/utils";
import {
  Star,
  Clock,
  ShieldCheck,
  Briefcase,
  Wallet,
  CalendarDays,
  Users,
  FileText,
  CheckCircle2,
  Video,
} from "lucide-react";

interface CounselorDetailViewProps {
  counselor: CounselorDetail;
}

export function CounselorDetailView({ counselor }: CounselorDetailViewProps) {
  const [bookingOpen, setBookingOpen] = useState(false);

  const initials = counselor.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getAvatarColor = (name: string) => {
    const colors = [
      { bg: "bg-blue-100", ring: "ring-blue-200", text: "text-blue-600" },
      { bg: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-600" },
      { bg: "bg-slate-100", ring: "ring-slate-200", text: "text-slate-600" },
      { bg: "bg-violet-100", ring: "ring-violet-200", text: "text-violet-600" },
      { bg: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-600" },
      { bg: "bg-cyan-100", ring: "ring-cyan-200", text: "text-cyan-600" },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarColor = getAvatarColor(counselor.fullName);

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Counselor Card */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden py-0">
            <CardContent className="p-0">
              {/* Avatar Section */}
              <div className="flex flex-col items-center pt-10 pb-6 bg-teal-50 relative">
                {counselor.verificationStatus === "VERIFIED" && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-primary text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </div>
                )}
                <div
                  className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold ring-4",
                    avatarColor.bg,
                    avatarColor.ring,
                    avatarColor.text
                  )}
                >
                  {initials}
                </div>
              </div>

              {/* Info Section */}
              <div className="p-6 text-center space-y-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {counselor.fullName}
                </h2>
                {counselor.professionalTitle && (
                  <p className="text-sm text-primary font-medium">
                    {counselor.professionalTitle}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center justify-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-800">
                    {counselor.avgRating > 0
                      ? counselor.avgRating.toFixed(1)
                      : "New"}
                  </span>
                  {counselor.totalReviews > 0 && (
                    <span className="text-sm text-gray-400">
                      ({counselor.totalReviews}{" "}
                      {counselor.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  )}
                </div>

                {/* Quick stats */}
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 pt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {counselor.experienceYears} yrs exp
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {counselor.totalAppointments} sessions
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <Button
                    onClick={() => setBookingOpen(true)}
                    className="w-full h-12 rounded-xl font-semibold text-base gap-2"
                  >
                    <Video className="w-5 h-5" />
                    Book Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <Card className="border border-gray-200 shadow-sm rounded-2xl">
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                About {counselor.fullName}
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                Professional background and expertise
              </p>

              {/* Description */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-gray-900">Description</h4>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed pl-6">
                    {counselor.bio || "No description provided yet."}
                  </p>
                </div>

                <div className="border-t border-gray-100" />

                {/* Specialties */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-gray-900">Specialties</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {counselor.specialties.length > 0 ? (
                      counselor.specialties.map((spec) => (
                        <Badge
                          key={spec}
                          variant="secondary"
                          className="bg-primary/8 text-primary border border-primary/15 text-sm font-normal px-4 py-1 rounded-full"
                        >
                          {spec}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No specialties listed</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Availability */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-gray-900">Availability</h4>
                  </div>
                  <p className="text-sm text-gray-600 pl-6">
                    {counselor.nextAvailable ? (
                      <>
                        Next available slot:{" "}
                        <span className="font-medium text-primary">
                          {new Date(counselor.nextAvailable).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(counselor.nextAvailable).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </>
                    ) : (
                      "No available slots at the moment"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card className="border border-gray-200 shadow-sm rounded-2xl">
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">
                Session Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Session Fee</p>
                    <p className="text-lg font-semibold text-gray-900">
                      Rs. {counselor.hourlyRate}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="text-lg font-semibold text-gray-900">60 mins</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Session Type</p>
                    <p className="text-lg font-semibold text-gray-900">Video Call</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(counselor.memberSince)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        counselorId={counselor.id}
        counselorName={counselor.fullName}
        hourlyRate={counselor.hourlyRate}
      />
    </>
  );
}
