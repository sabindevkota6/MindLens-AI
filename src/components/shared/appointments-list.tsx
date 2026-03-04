"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Radio,
  Loader2,
  Mail,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAppointments } from "@/lib/actions/appointment";

// --- Types ---
type AppointmentCategory = "upcoming" | "ongoing" | "completed" | "missed" | "cancelled";

export interface Appointment {
  id: string;
  status: string;
  meetingLink: string | null;
  patientNote: string | null;
  cancelledBy: string | null;
  createdAt: Date;
  slotStart: Date;
  slotEnd: Date;
  patient: { id: string; fullName: string; email: string };
  counselor: {
    id: string;
    fullName: string;
    professionalTitle: string | null;
    email: string;
  };
  hasReview: boolean;
  reviewRating: number | null;
}

interface AppointmentsListProps {
  role: "PATIENT" | "COUNSELOR";
  initialAppointments: Appointment[];
  initialTotalPages: number;
  initialCategory: AppointmentCategory;
}

// --- Status badge styling ---
function getStatusBadge(status: string) {
  switch (status) {
    case "SCHEDULED":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
          Upcoming
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
          Completed
        </Badge>
      );
    case "MISSED":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
          Missed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function AppointmentsList({
  role,
  initialAppointments,
  initialTotalPages,
  initialCategory,
}: AppointmentsListProps) {
  const router = useRouter();
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] =
    useState<AppointmentCategory>(initialCategory);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isPatient = role === "PATIENT";
  const basePath = isPatient
    ? "/dashboard/patient/appointments"
    : "/dashboard/counselor/appointments";

  // --- Fetch appointments ---
  function fetchPage(category: AppointmentCategory, page: number) {
    startTransition(async () => {
      const result = await getAppointments(category, page);
      setAppointments(result.appointments as Appointment[]);
      setTotalPages(result.totalPages);
      setCurrentPage(page);
    });
  }

  function handleTabChange(tab: string) {
    const category = tab as AppointmentCategory;
    setActiveTab(category);
    setActionMessage(null);
    fetchPage(category, 1);
  }

  return (
    <div className="space-y-6">
      {/* Action feedback */}
      {actionMessage && (
        <Alert
          variant={
            actionMessage.type === "error" ? "destructive" : "default"
          }
          className={
            actionMessage.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : ""
          }
        >
          <AlertDescription>{actionMessage.text}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-5 h-12 bg-white border">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg font-medium"
          >
            <Clock className="w-4 h-4 mr-2 hidden sm:block" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger
            value="ongoing"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg font-medium"
          >
            <Radio className="w-4 h-4 mr-2 hidden sm:block" />
            Ongoing
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg font-medium"
          >
            <CheckCircle2 className="w-4 h-4 mr-2 hidden sm:block" />
            Completed
          </TabsTrigger>
          <TabsTrigger
            value="missed"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg font-medium"
          >
            <AlertTriangle className="w-4 h-4 mr-2 hidden sm:block" />
            Missed
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg font-medium"
          >
            <XCircle className="w-4 h-4 mr-2 hidden sm:block" />
            Cancelled
          </TabsTrigger>
        </TabsList>

        {/* Content for all tabs */}
        {(["upcoming", "ongoing", "completed", "missed", "cancelled"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {isPending ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  {tab === "ongoing" && (
                    <Radio className="w-7 h-7 text-gray-400" />
                  )}
                  {tab === "upcoming" && (
                    <Clock className="w-7 h-7 text-gray-400" />
                  )}
                  {tab === "completed" && (
                    <CheckCircle2 className="w-7 h-7 text-gray-400" />
                  )}
                  {tab === "missed" && (
                    <AlertTriangle className="w-7 h-7 text-gray-400" />
                  )}
                  {tab === "cancelled" && (
                    <XCircle className="w-7 h-7 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  No {tab} appointments
                </h3>
                <p className="text-gray-500 text-sm">
                  {tab === "ongoing" &&
                    "No sessions are currently in progress."}
                  {tab === "upcoming" &&
                    "You don't have any upcoming appointments scheduled."}
                  {tab === "completed" && "No completed appointments yet."}
                  {tab === "missed" &&
                    "Great! You haven't missed any appointments."}
                  {tab === "cancelled" &&
                    "You don't have any cancelled appointments."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => {
                  const start = new Date(appt.slotStart);
                  const end = new Date(appt.slotEnd);
                  const now = new Date();
                  const isOngoing =
                    now >= start && now < end && appt.status === "SCHEDULED";
                  const otherName = isPatient
                    ? appt.counselor.fullName
                    : appt.patient.fullName;
                  const otherEmail = isPatient
                    ? appt.counselor.email
                    : appt.patient.email;
                  const title = isPatient
                    ? appt.counselor.professionalTitle
                    : null;

                  return (
                    <button
                      key={appt.id}
                      onClick={() => router.push(`${basePath}/${appt.id}`)}
                      className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:border-gray-300 text-left group"
                    >
                      <div className="flex items-center justify-between p-5">
                        <div className="flex-1 min-w-0">
                          {/* Name + title */}
                          <h3 className="font-semibold text-gray-900 truncate">
                            {otherName}
                            {title && (
                              <span className="font-normal text-gray-500">
                                {" "}
                                &mdash; {title}
                              </span>
                            )}
                          </h3>

                          {/* Email */}
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{otherEmail}</span>
                          </div>

                          {/* Date & time */}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(start, "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {format(start, "h:mm a")} &ndash;{" "}
                              {format(end, "h:mm a")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          {/* show live pulse for ongoing, otherwise status badge */}
                          {isOngoing ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                              <span className="text-xs font-medium text-amber-700">
                                Live
                              </span>
                            </div>
                          ) : (
                            getStatusBadge(appt.status)
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || isPending}
                  onClick={() => fetchPage(activeTab, currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Button
                        key={p}
                        variant={p === currentPage ? "default" : "outline"}
                        size="sm"
                        className={`w-9 h-9 ${p === currentPage ? "bg-primary text-white" : ""}`}
                        disabled={isPending}
                        onClick={() => fetchPage(activeTab, p)}
                      >
                        {p}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || isPending}
                  onClick={() => fetchPage(activeTab, currentPage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}