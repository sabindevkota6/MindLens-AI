import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getAdminCounselorDetail } from "@/lib/actions/admin-user-management";
import { AdminDocDownloadButton } from "@/components/admin/admin-doc-download-button";
import {
  BanUserDialog,
  UnbanUserDialog,
  SuspendUserDialog,
  UnsuspendUserDialog,
  VerifyCounselorDialog,
  RevokeVerificationDialog,
} from "@/components/admin/user-action-dialogs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  ShieldX,
  Clock,
  Ban,
  CalendarDays,
  FileText,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// renders a single filled or empty star
function StarIcon({ filled }: { filled: boolean }) {
  return <Star className={cn("w-4 h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />;
}

// stat box used in the analytics grid
function StatBox({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={cn("text-3xl font-bold tracking-tight", color ?? "text-gray-900")}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// account status badge
function AccountStatusBadge({ isBanned, isSuspended, suspendedUntil }: { isBanned: boolean; isSuspended: boolean; suspendedUntil: string | null }) {
  if (isBanned) return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><Ban className="w-3 h-3" />Banned</Badge>;
  if (isSuspended) return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
      <Clock className="w-3 h-3" />
      Suspended{suspendedUntil ? ` until ${format(new Date(suspendedUntil), "MMM d")}` : ""}
    </Badge>
  );
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"><CheckCircle className="w-3 h-3" />Active</Badge>;
}

// verification status badge
function VerificationBadge({ status }: { status: string }) {
  if (status === "VERIFIED") return <Badge className="bg-teal-100 text-teal-700 border-teal-200 gap-1"><ShieldCheck className="w-3 h-3" />Verified</Badge>;
  if (status === "REJECTED") return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
}

// maps AdminAction enum value to a readable label
function auditActionLabel(action: string) {
  const map: Record<string, string> = {
    BAN: "Banned",
    UNBAN: "Unbanned",
    SUSPEND: "Suspended",
    UNSUSPEND: "Unsuspended",
    VERIFY_COUNSELOR: "Verified",
    REVOKE_VERIFICATION: "Revoked Verification",
  };
  return map[action] ?? action;
}

function auditActionColor(action: string) {
  if (action === "BAN") return "text-red-600";
  if (action === "UNBAN" || action === "UNSUSPEND") return "text-emerald-600";
  if (action === "SUSPEND" || action === "REVOKE_VERIFICATION") return "text-amber-600";
  if (action === "VERIFY_COUNSELOR") return "text-teal-600";
  return "text-gray-600";
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCounselorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getAdminCounselorDetail(id);

  if (!data || "error" in data) notFound();

  const c = data;

  const initials = c.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarColor = "bg-primary/10 text-primary";

  const completionRate = c.totalAppointments > 0
    ? Math.round((c.completedAppointments / c.totalAppointments) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header band */}
      <section className="pt-16">
        <div className="bg-primary px-4 sm:px-6 lg:px-8 py-10 pb-20">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/dashboard/admin/users/counselors"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Counselors
            </Link>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* avatar */}
              {c.image ? (
                <img
                  src={c.image}
                  alt={c.fullName}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 ring-4 ring-white/20 shadow-sm"
                />
              ) : (
                <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0 ring-4 ring-white/20", avatarColor)}>
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{c.fullName}</h1>
                  <AccountStatusBadge isBanned={c.isBanned} isSuspended={c.isSuspended} suspendedUntil={c.suspendedUntil} />
                  <VerificationBadge status={c.verificationStatus} />
                </div>
                {c.professionalTitle && <p className="text-white/70 text-base">{c.professionalTitle}</p>}
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 pt-1">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{c.email}</span>
                  {c.phoneNumber && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{c.phoneNumber}</span>}
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Registered {format(new Date(c.registeredAt), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* admin actions bar */}
          <Card className="border-0 shadow-sm">
            <CardContent className="py-4 px-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-500 mr-1">Admin Actions:</span>

                {/* verification actions */}
                {c.verificationStatus !== "VERIFIED" && (
                  <VerifyCounselorDialog counselorProfileId={c.id} counselorName={c.fullName} />
                )}
                {c.verificationStatus === "VERIFIED" && (
                  <RevokeVerificationDialog counselorProfileId={c.id} counselorName={c.fullName} />
                )}

                <Separator orientation="vertical" className="h-7 hidden sm:block" />

                {/* account enforcement actions */}
                {!c.isBanned && !c.isSuspended && (
                  <SuspendUserDialog userId={c.userId} userName={c.fullName} />
                )}
                {c.isSuspended && !c.isBanned && (
                  <UnsuspendUserDialog userId={c.userId} userName={c.fullName} />
                )}
                {!c.isBanned && (
                  <BanUserDialog userId={c.userId} userName={c.fullName} />
                )}
                {c.isBanned && (
                  <UnbanUserDialog userId={c.userId} userName={c.fullName} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* suspension / ban notice */}
          {(c.isBanned || c.isSuspended) && (
            <Card className={cn("border-0 shadow-sm", c.isBanned ? "bg-red-50" : "bg-amber-50")}>
              <CardContent className="py-4 px-6 flex items-start gap-3">
                {c.isBanned
                  ? <Ban className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  : <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                }
                <div className="space-y-0.5">
                  <p className={cn("font-semibold text-sm", c.isBanned ? "text-red-800" : "text-amber-800")}>
                    {c.isBanned ? "Account Banned" : `Suspended until ${c.suspendedUntil ? format(new Date(c.suspendedUntil), "MMMM d, yyyy") : "—"}`}
                  </p>
                  {(c.banReason || c.suspendReason) && (
                    <p className={cn("text-sm", c.isBanned ? "text-red-600" : "text-amber-700")}>
                      {c.isBanned ? c.banReason : c.suspendReason}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* analytics grid */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Analytics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatBox label="Avg Rating" value={c.avgRating > 0 ? c.avgRating.toFixed(1) : "N/A"} sub={`${c.totalReviews} reviews`} color="text-yellow-500" />
              <StatBox label="1-Star Reviews" value={c.oneStarCount} sub="quality risk" color={c.oneStarCount >= 15 ? "text-red-600" : c.oneStarCount >= 7 ? "text-amber-600" : "text-gray-900"} />
              <StatBox label="Total Sessions" value={c.totalAppointments} />
              <StatBox label="Completed" value={c.completedAppointments} sub={`${completionRate}% completion`} color="text-emerald-600" />
              <StatBox label="Missed" value={c.missedAppointments} color={c.missedAppointments > 5 ? "text-amber-600" : "text-gray-900"} />
              <StatBox label="Cancelled" value={c.cancelledAppointments} />
            </div>
          </div>

          {/* rating visual */}
          {c.avgRating > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-5 px-6 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => <StarIcon key={s} filled={s <= Math.round(c.avgRating)} />)}
                </div>
                <span className="text-2xl font-bold text-gray-900">{c.avgRating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">out of 5 · {c.totalReviews} {c.totalReviews === 1 ? "review" : "reviews"}</span>
                {c.oneStarCount >= 7 && (
                  <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200 gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {c.oneStarCount} one-star ratings
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* profile info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4" />
                    Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Experience</span>
                    <span className="font-medium text-gray-700">{c.experienceYears} years</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hourly Rate</span>
                    <span className="font-medium text-gray-700">${c.hourlyRate.toFixed(2)}/hr</span>
                  </div>
                  {c.bio && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-gray-400 mb-1">Bio</p>
                        <p className="text-gray-700 leading-relaxed">{c.bio}</p>
                      </div>
                    </>
                  )}
                  {c.specialties.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-gray-400 mb-2">Specialties</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.specialties.map((s) => (
                            <Badge key={s.id} variant="secondary" className="bg-teal-50 text-teal-700 border border-teal-100 font-normal text-xs">
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* audit log */}
              {c.recentAuditLog.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                      <Activity className="w-4 h-4" />
                      Recent Admin Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {c.recentAuditLog.map((log, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className={cn("font-medium", auditActionColor(log.action))}>
                            {auditActionLabel(log.action)}
                          </span>
                          {log.reason && <p className="text-gray-400 text-xs truncate">{log.reason}</p>}
                          <p className="text-gray-400 text-xs">{format(new Date(log.createdAt), "MMM d, yyyy")} · {log.adminName}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* right column: reviews + documents */}
            <div className="lg:col-span-2 space-y-6">
              {/* recent reviews */}
              {c.recentReviews.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                      <Star className="w-4 h-4" />
                      Recent Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {c.recentReviews.map((r) => (
                      <div key={r.id} className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => <StarIcon key={s} filled={s <= r.rating} />)}
                          </div>
                          <span className={cn("text-xs font-semibold", r.rating === 1 ? "text-red-500" : r.rating >= 4 ? "text-emerald-600" : "text-gray-500")}>
                            {r.rating}/5
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">{format(new Date(r.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                        <Separator />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* verification documents */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                    <FileText className="w-4 h-4" />
                    Verification Documents
                    <Badge variant="secondary" className="ml-auto font-normal">{c.documents.length} file{c.documents.length !== 1 ? "s" : ""}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {c.documents.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {c.documents.map((doc, i) => (
                        <div key={doc.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-teal-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-700">Document {i + 1}</p>
                              <p className="text-xs text-gray-400">{format(new Date(doc.uploadedAt), "MMM d, yyyy · h:mm a")}</p>
                            </div>
                          </div>
                          <AdminDocDownloadButton documentId={doc.id} label="View" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
