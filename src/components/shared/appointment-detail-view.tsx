"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Star,
  AlertTriangle,
  Ban,
  CheckCircle2,
  X,
  MessageSquare,
  Loader2,
  Flag,
  ArrowLeftRight,
  Mail,
  Briefcase,
  DollarSign,
  Award,
  BookOpen,
  HeartPulse,
  BarChart3,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelAppointment,
  markAppointmentCompleted,
  addPatientNote,
  submitReview,
  reportPatient,
  adjustAppointmentTime,
  getAvailableSlotsForAdjustment,
} from "@/lib/actions/appointment";

// ─── Types ───
export type AppointmentDetail = {
  id: string;
  status: string;
  meetingLink: string | null;
  patientNote: string | null;
  cancelledBy: string | null;
  createdAt: Date;
  slotStart: Date;
  slotEnd: Date;
  patient: {
    id: string;
    fullName: string;
    email: string;
    image: string | null;
    bio: string | null;
    dateOfBirth: Date | null;
    memberSince: Date;
  };
  counselor: {
    id: string;
    fullName: string;
    professionalTitle: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    experienceYears: number;
    hourlyRate: number;
    specialties: string[];
    avgRating: number;
    totalReviews: number;
    totalAppointments: number;
    memberSince: Date;
  };
  medicalConcern: string | null;
  emotionLog: { id: string; dominantEmotion: string; recordedAt: Date } | null;
  review: { id: string; rating: number; comment: string | null } | null;
  hasReport: boolean;
  canCancel: boolean;
  canAdjust: boolean;
  canMarkComplete: boolean;
  canReview: boolean;
  canReport: boolean;
  canAddNote: boolean;
};

interface AppointmentDetailViewProps {
  appointment: AppointmentDetail;
  role: "PATIENT" | "COUNSELOR";
}

// ─── Status badge ───
function getStatusBadge(status: string) {
  switch (status) {
    case "SCHEDULED":
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Upcoming</Badge>;
    case "COMPLETED":
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Completed</Badge>;
    case "MISSED":
      return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Missed</Badge>;
    case "CANCELLED":
      return <Badge className="bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─── Join meeting helper ───
function getJoinStatus(slotStart: Date, slotEnd: Date) {
  const now = new Date();
  const msUntilStart = slotStart.getTime() - now.getTime();
  const minutesUntilStart = msUntilStart / (1000 * 60);
  const isEnded = now >= slotEnd;
  const isOngoing = now >= slotStart && now < slotEnd;
  return { minutesUntilStart, isEnded, isOngoing };
}

function formatTimeRemaining(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${Math.round(minutes)}m`;
}

export function AppointmentDetailView({ appointment, role }: AppointmentDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const isPatient = role === "PATIENT";

  const start = new Date(appointment.slotStart);
  const end = new Date(appointment.slotEnd);
  const now = new Date();
  const isOngoing = now >= start && now < end && appointment.status === "SCHEDULED";

  // ─── Dialog states ───
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState(appointment.patientNote || "");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ id: string; startTime: Date; endTime: Date }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinDialogData, setJoinDialogData] = useState<{ message: string; link: string | null; canJoin: boolean } | null>(null);

  // ─── Handlers ───
  function handleJoinClick() {
    const { minutesUntilStart, isEnded, isOngoing: ongoing } = getJoinStatus(start, end);

    if (appointment.status === "MISSED") {
      setJoinDialogData({ message: "You missed this appointment.", link: null, canJoin: false });
      setJoinDialogOpen(true);
      return;
    }
    if (isEnded) {
      setJoinDialogData({ message: "This appointment's time has already ended.", link: null, canJoin: false });
      setJoinDialogOpen(true);
      return;
    }
    if (minutesUntilStart <= 2 || ongoing) {
      if (appointment.meetingLink) router.push(`/dashboard/meeting/${appointment.id}`);
      return;
    }
    if (minutesUntilStart > 30) {
      setJoinDialogData({ message: `Hi Early Bird! 🐦 You still have ${formatTimeRemaining(minutesUntilStart)} before the appointment. You can join up to 30 minutes before.`, link: null, canJoin: false });
      setJoinDialogOpen(true);
      return;
    }
    setJoinDialogData({ message: `Hi Early Bird! 😊 You still have ${formatTimeRemaining(minutesUntilStart)} before the appointment. Do you still want to join?`, link: `/dashboard/meeting/${appointment.id}`, canJoin: true });
    setJoinDialogOpen(true);
  }

  function confirmCancel() {
    startTransition(async () => {
      const result = await cancelAppointment(appointment.id);
      setCancelDialogOpen(false);
      if (result.error) setActionMessage({ type: "error", text: result.error });
      else { setActionMessage({ type: "success", text: result.success! }); router.refresh(); }
    });
  }

  function confirmComplete() {
    startTransition(async () => {
      const result = await markAppointmentCompleted(appointment.id);
      setCompleteDialogOpen(false);
      if (result.error) setActionMessage({ type: "error", text: result.error });
      else { setActionMessage({ type: "success", text: result.success! }); router.refresh(); }
    });
  }

  function confirmNote() {
    startTransition(async () => {
      const result = await addPatientNote(appointment.id, noteText);
      setNoteDialogOpen(false);
      if (result.error) setActionMessage({ type: "error", text: result.error });
      else { setActionMessage({ type: "success", text: result.success! }); router.refresh(); }
    });
  }

  function confirmReview() {
    if (reviewRating === 0) return;
    startTransition(async () => {
      const result = await submitReview(appointment.id, reviewRating, reviewComment);
      setReviewDialogOpen(false);
      if (result.error) setActionMessage({ type: "error", text: result.error });
      else { setActionMessage({ type: "success", text: result.success! }); router.refresh(); }
    });
  }

  function confirmReport() {
    startTransition(async () => {
      const result = await reportPatient(appointment.id, reportReason);
      setReportDialogOpen(false);
      if (result.error) setActionMessage({ type: "error", text: result.error });
      else { setActionMessage({ type: "success", text: result.success! }); router.refresh(); }
    });
  }

  function handleAdjustClick() {
    setSelectedSlotId(null);
    setAvailableSlots([]);
    setAdjustDialogOpen(true);
    setLoadingSlots(true);
    getAvailableSlotsForAdjustment(appointment.counselor.id, new Date(appointment.slotStart)).then((slots) => {
      setAvailableSlots(slots as { id: string; startTime: Date; endTime: Date }[]);
      setLoadingSlots(false);
    });
  }

  function confirmAdjust() {
    if (!selectedSlotId) return;
    startTransition(async () => {
      const result = await adjustAppointmentTime(appointment.id, selectedSlotId);
      setAdjustDialogOpen(false);
      if (result.error) setActionMessage({ type: "error", text: result.error });
      else { setActionMessage({ type: "success", text: result.success! }); router.refresh(); }
    });
  }

  const counselor = appointment.counselor;
  const patient = appointment.patient;
  const hasInsights = !isPatient && !!(appointment.medicalConcern || appointment.emotionLog);

  function ActionsCard() {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Actions</h3>

        <div className="flex flex-wrap gap-3">
          {appointment.status === "SCHEDULED" && appointment.meetingLink && (
            <Button onClick={handleJoinClick} className="bg-primary hover:bg-primary/90 gap-2">
              <Video className="w-4 h-4" />
              Join Meeting
            </Button>
          )}
          {appointment.canMarkComplete && (
            <Button onClick={() => setCompleteDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Mark Completed
            </Button>
          )}
          {appointment.canAddNote && (
            <Button variant="outline" onClick={() => setNoteDialogOpen(true)} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              {appointment.patientNote ? "Edit Note" : "Add Note"}
            </Button>
          )}
          {appointment.canReview && (
            <Button variant="outline" onClick={() => setReviewDialogOpen(true)} className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
              <Star className="w-4 h-4" />
              Write Review
            </Button>
          )}
          {appointment.canAdjust && (
            <Button variant="outline" onClick={handleAdjustClick} className="gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              Adjust Time
            </Button>
          )}
          {appointment.canCancel && (
            <Button variant="outline" onClick={() => setCancelDialogOpen(true)} className="gap-2 border-red-300 text-red-600 hover:bg-red-50">
              <Ban className="w-4 h-4" />
              Cancel Appointment
            </Button>
          )}
          {appointment.canReport && !appointment.hasReport && (
            <Button variant="outline" onClick={() => setReportDialogOpen(true)} className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50">
              <Flag className="w-4 h-4" />
              Report Patient
            </Button>
          )}
          {!(appointment.status === "SCHEDULED" && appointment.meetingLink) &&
            !appointment.canCancel &&
            !appointment.canAdjust &&
            !appointment.canReview &&
            !appointment.canAddNote &&
            !appointment.canReport && (
            <p className="text-sm text-gray-400 italic">No actions available for this appointment.</p>
          )}
        </div>

        <Separator />
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p>Cancellation is allowed up to <strong>4 hours</strong> before the scheduled time.</p>
            {isPatient ? (
              <p>For time adjustments, you can request the counselor using the &apos;Add Note&apos; option.</p>
            ) : (
              <>
                <p>Time adjustments are allowed up to <strong>2 hours</strong> before the appointment (same day only).</p>
                <p>Appointments not marked as completed within <strong>5 minutes</strong> after the end time will be marked as missed.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action feedback */}
      {actionMessage && (
        <div className={`p-4 rounded-lg border text-sm ${actionMessage.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {actionMessage.text}
        </div>
      )}

      {/* ─── Main content grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Left column: Profile info ─── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Avatar header */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
              {(() => {
                const profileImage = isPatient ? counselor.image : patient.image;
                const profileName = isPatient ? counselor.fullName : patient.fullName;
                const initials = profileName.split(" ").filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                return profileImage ? (
                  <img
                    src={profileImage}
                    alt={profileName}
                    className="w-20 h-20 mx-auto rounded-full object-cover mb-3 ring-4 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-primary">{initials}</span>
                  </div>
                );
              })()}
              <h2 className="text-lg font-bold text-gray-900">
                {isPatient ? counselor.fullName : patient.fullName}
              </h2>
              {isPatient && counselor.professionalTitle && (
                <p className="text-sm text-primary font-medium mt-0.5">{counselor.professionalTitle}</p>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-gray-400">
                <Mail className="w-3 h-3" />
                <span>{isPatient ? counselor.email : patient.email}</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* ─── Patient viewing counselor profile ─── */}
              {isPatient && (
                <>
                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Rating</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(counselor.avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{counselor.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({counselor.totalReviews})</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Experience */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Experience
                    </span>
                    <span className="text-sm font-medium text-gray-700">{counselor.experienceYears} years</span>
                  </div>

                  {/* Hourly Rate */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Session Fee
                    </span>
                    <span className="text-sm font-medium text-gray-700">Rs. {counselor.hourlyRate}</span>
                  </div>

                  {/* Total Sessions */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Sessions
                    </span>
                    <span className="text-sm font-medium text-gray-700">{counselor.totalAppointments} completed</span>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Member Since
                    </span>
                    <span className="text-sm font-medium text-gray-700">{format(new Date(counselor.memberSince), "MMM yyyy")}</span>
                  </div>

                  {/* Specialties */}
                  {counselor.specialties.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Specialties</p>
                        <div className="flex flex-wrap gap-1.5">
                          {counselor.specialties.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Bio */}
                  {counselor.bio && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-gray-500 mb-1.5">About</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{counselor.bio}</p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ─── Counselor viewing patient profile ─── */}
              {!isPatient && (
                <>
                  {/* Date of Birth */}
                  {patient.dateOfBirth && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Date of Birth
                      </span>
                      <span className="text-sm font-medium text-gray-700">{format(new Date(patient.dateOfBirth), "MMM d, yyyy")}</span>
                    </div>
                  )}

                  {/* Member Since */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Member Since
                    </span>
                    <span className="text-sm font-medium text-gray-700">{format(new Date(patient.memberSince), "MMM yyyy")}</span>
                  </div>

                  {/* Bio */}
                  {patient.bio && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-gray-500 mb-1.5">About</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{patient.bio}</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

        {/* ─── Right column: Appointment details + actions ─── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Appointment info card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Appointment Details</h3>
                <p className="text-sm text-gray-500 mt-0.5">Booked on {format(new Date(appointment.createdAt), "MMM d, yyyy \'at\' h:mm a")}</p>
              </div>
              {getStatusBadge(appointment.status)}
            </div>

            <Separator />

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Date</p>
                  <p className="text-sm font-semibold text-gray-900">{format(start, "EEEE, MMMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Time</p>
                  <p className="text-sm font-semibold text-gray-900">{format(start, "h:mm a")} – {format(end, "h:mm a")}</p>
                </div>
              </div>
            </div>

            {/* Ongoing indicator */}
            {isOngoing && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <p className="text-sm font-medium text-amber-800">
                  {isPatient
                    ? "Hurry up! The appointment time has already started. The counselor is waiting for you."
                    : "Session is ongoing. The patient should be in the meeting room."}
                </p>
              </div>
            )}

            {/* Patient note */}
            {appointment.patientNote && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
                  {isPatient ? "Your Note" : "Patient's Note"}
                </p>
                <p className="text-sm text-blue-900 leading-relaxed">{appointment.patientNote}</p>
              </div>
            )}

            {/* Review display */}
            {appointment.review && (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    {isPatient ? "Your Review" : "Patient's Review"}
                  </p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= appointment.review!.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                </div>
                {appointment.review.comment && (
                  <p className="text-sm text-amber-900 leading-relaxed">{appointment.review.comment}</p>
                )}
              </div>
            )}

            {/* Missed warning */}
            {appointment.status === "MISSED" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Missed appointment.</strong> Missing appointments can lead to a bad rating and permanent ban from the application.
                </p>
              </div>
            )}

            {/* Cancelled info */}
            {appointment.status === "CANCELLED" && appointment.cancelledBy && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  This appointment was cancelled by the <strong>{appointment.cancelledBy.toLowerCase()}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* ─── Patient insights card (counselor only) ─── */}
          {!isPatient && (appointment.medicalConcern || appointment.emotionLog) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Patient Insights</h3>

              {appointment.medicalConcern && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <HeartPulse className="w-4 h-4 text-teal-600 shrink-0" />
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Medical Concern</p>
                  </div>
                  <p className="text-sm text-teal-900 leading-relaxed">{appointment.medicalConcern}</p>
                </div>
              )}

              {appointment.emotionLog && (
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-violet-600 shrink-0" />
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Emotion Analysis</p>
                    </div>
                    <a
                      href={`/api/counselor/emotion-report/${appointment.emotionLog.id}`}
                      download
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </a>
                  </div>
                  <p className="text-sm text-violet-900">
                    Dominant emotion:{" "}
                    <span className="font-semibold capitalize">{appointment.emotionLog.dominantEmotion.toLowerCase()}</span>
                    <span className="text-violet-500 ml-2 text-xs">
                      · recorded {format(new Date(appointment.emotionLog.recordedAt), "MMM d, yyyy")}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* actions card inside right col only when no insights */}
          {!hasInsights && <ActionsCard />}
        </div>
      </div>

      {/* actions card full-width below grid when insights are present */}
      {hasInsights && <ActionsCard />}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone. The other party will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isPending}>Keep Appointment</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Completed</DialogTitle>
            <DialogDescription>Confirm that this session has been completed. The patient will then be able to leave a review.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={confirmComplete} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirm Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a Note</DialogTitle>
            <DialogDescription>Share any requests or notes for this appointment. Max 1000 characters.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Type your note here..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            maxLength={1000}
            className="resize-none"
          />
          <p className="text-xs text-gray-400 text-right">{noteText.length}/1000</p>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={confirmNote} disabled={isPending || !noteText.trim()}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>How was your session? Your feedback helps other patients find the right counselor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setReviewHover(star)}
                  onMouseLeave={() => setReviewHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-9 h-9 transition-colors ${star <= (reviewHover || reviewRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
            {reviewRating > 0 && (
              <p className="text-center text-sm text-gray-600">
                {reviewRating === 1 && "Poor"}
                {reviewRating === 2 && "Below Average"}
                {reviewRating === 3 && "Average"}
                {reviewRating === 4 && "Good"}
                {reviewRating === 5 && "Excellent"}
              </p>
            )}
            <Textarea placeholder="Write a comment (optional)..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} maxLength={2000} className="resize-none" />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={confirmReview} disabled={isPending || reviewRating === 0} className="bg-amber-500 hover:bg-amber-600">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Patient</DialogTitle>
            <DialogDescription>Please describe the issue. Reports are reviewed by the MindLens AI admin team.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Describe the reason for reporting..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows={4} maxLength={2000} className="resize-none" />
          <p className="text-xs text-gray-400 text-right">{reportReason.length}/2000</p>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReport} disabled={isPending || !reportReason.trim()}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flag className="w-4 h-4 mr-2" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Time Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Adjust Appointment Time</DialogTitle>
            <DialogDescription>Select a new available slot on the same day. The patient will be notified via email.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            {loadingSlots ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">No available slots found on this day.</p>
            ) : (
              <div className="space-y-2">
                {availableSlots.map((slot) => {
                  const slotStart = new Date(slot.startTime);
                  const slotEnd = new Date(slot.endTime);
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{format(slotStart, "EEEE, MMM d, yyyy")}</p>
                          <p className="text-xs text-gray-500">{format(slotStart, "h:mm a")} – {format(slotEnd, "h:mm a")}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={confirmAdjust} disabled={isPending || !selectedSlotId}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowLeftRight className="w-4 h-4 mr-2" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Meeting Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Meeting Room
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 leading-relaxed">{joinDialogData?.message}</p>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            {joinDialogData?.canJoin && joinDialogData.link && (
              <Button onClick={() => { router.push(joinDialogData.link!); setJoinDialogOpen(false); }} className="bg-primary hover:bg-primary/90">
                <Video className="w-4 h-4 mr-2" />
                Join Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
