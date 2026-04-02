import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getAdminPatientDetail } from "@/lib/actions/admin-user-management";
import {
  BanUserDialog,
  UnbanUserDialog,
  SuspendUserDialog,
  UnsuspendUserDialog,
} from "@/components/admin/user-action-dialogs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Ban,
  CalendarDays,
  Activity,
  CheckCircle,
  User,
  Mail,
  Phone,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// stat box shared with counselor detail
function StatBox({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={cn("text-3xl font-bold tracking-tight", color ?? "text-gray-900")}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

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

function auditActionLabel(action: string) {
  const map: Record<string, string> = { BAN: "Banned", UNBAN: "Unbanned", SUSPEND: "Suspended", UNSUSPEND: "Unsuspended" };
  return map[action] ?? action;
}
function auditActionColor(action: string) {
  if (action === "BAN") return "text-red-600";
  if (action === "UNBAN" || action === "UNSUSPEND") return "text-emerald-600";
  if (action === "SUSPEND") return "text-amber-600";
  return "text-gray-600";
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPatientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getAdminPatientDetail(id);

  if (!data || "error" in data) notFound();

  const p = data;

  const initials = p.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarColors = ["bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];
  let hash = 0;
  for (let i = 0; i < p.fullName.length; i++) hash = p.fullName.charCodeAt(i) + ((hash << 5) - hash);
  const avatarColor = avatarColors[Math.abs(hash) % avatarColors.length];

  const completionRate = p.totalAppointments > 0
    ? Math.round((p.completedAppointments / p.totalAppointments) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-16">
        <div className="bg-primary px-4 sm:px-6 lg:px-8 py-10 pb-20">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/dashboard/admin/users/patients"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Patients
            </Link>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0 ring-4 ring-white/20", avatarColor)}>
                {initials}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{p.fullName}</h1>
                  <AccountStatusBadge isBanned={p.isBanned} isSuspended={p.isSuspended} suspendedUntil={p.suspendedUntil} />
                  {p.totalReports > 0 && (
                    <Badge className="bg-red-400/20 text-red-100 border-red-300/30 gap-1">
                      <Flag className="w-3 h-3" />
                      {p.totalReports} {p.totalReports === 1 ? "report" : "reports"}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 pt-1">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{p.email}</span>
                  {p.phoneNumber && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{p.phoneNumber}</span>}
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Registered {format(new Date(p.registeredAt), "MMM d, yyyy")}</span>
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
                {!p.isBanned && !p.isSuspended && <SuspendUserDialog userId={p.userId} userName={p.fullName} />}
                {p.isSuspended && !p.isBanned && <UnsuspendUserDialog userId={p.userId} userName={p.fullName} />}
                {!p.isBanned && <BanUserDialog userId={p.userId} userName={p.fullName} />}
                {p.isBanned && <UnbanUserDialog userId={p.userId} userName={p.fullName} />}
              </div>
            </CardContent>
          </Card>

          {/* suspension / ban notice */}
          {(p.isBanned || p.isSuspended) && (
            <Card className={cn("border-0 shadow-sm", p.isBanned ? "bg-red-50" : "bg-amber-50")}>
              <CardContent className="py-4 px-6 flex items-start gap-3">
                {p.isBanned
                  ? <Ban className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  : <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                }
                <div className="space-y-0.5">
                  <p className={cn("font-semibold text-sm", p.isBanned ? "text-red-800" : "text-amber-800")}>
                    {p.isBanned ? "Account Banned" : `Suspended until ${p.suspendedUntil ? format(new Date(p.suspendedUntil), "MMMM d, yyyy") : "—"}`}
                  </p>
                  {(p.banReason || p.suspendReason) && (
                    <p className={cn("text-sm", p.isBanned ? "text-red-600" : "text-amber-700")}>
                      {p.isBanned ? p.banReason : p.suspendReason}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* report risk alert */}
          {p.totalReports >= 7 && !p.isBanned && (
            <Card className={cn("border-0 shadow-sm", p.totalReports >= 15 ? "bg-red-50" : "bg-amber-50")}>
              <CardContent className="py-4 px-6 flex items-start gap-3">
                <AlertTriangle className={cn("w-5 h-5 mt-0.5 flex-shrink-0", p.totalReports >= 15 ? "text-red-500" : "text-amber-500")} />
                <div>
                  <p className={cn("font-semibold text-sm", p.totalReports >= 15 ? "text-red-800" : "text-amber-800")}>
                    {p.totalReports >= 15 ? "High risk — approaching auto-ban threshold" : "Warning — approaching auto-suspension threshold"}
                  </p>
                  <p className={cn("text-xs mt-0.5", p.totalReports >= 15 ? "text-red-600" : "text-amber-600")}>
                    {p.totalReports} reports · Auto-ban triggers at 20, auto-suspend at 10
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* analytics grid */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Analytics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatBox label="Total Reports" value={p.totalReports} color={p.totalReports >= 10 ? "text-red-600" : p.totalReports >= 7 ? "text-amber-600" : "text-gray-900"} />
              <StatBox label="Total Sessions" value={p.totalAppointments} />
              <StatBox label="Completed" value={p.completedAppointments} sub={`${completionRate}% completion`} color="text-emerald-600" />
              <StatBox label="Missed" value={p.missedAppointments} color={p.missedAppointments > 5 ? "text-amber-600" : "text-gray-900"} />
              <StatBox label="Cancelled" value={p.cancelledAppointments} />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* profile */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4" />
                    Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {p.dateOfBirth && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date of Birth</span>
                        <span className="font-medium text-gray-700">{format(new Date(p.dateOfBirth), "MMM d, yyyy")}</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  {p.bio ? (
                    <div>
                      <p className="text-gray-400 mb-1">Bio</p>
                      <p className="text-gray-700 leading-relaxed">{p.bio}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs">No bio provided.</p>
                  )}
                </CardContent>
              </Card>

              {/* audit log */}
              {p.recentAuditLog.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                      <Activity className="w-4 h-4" />
                      Recent Admin Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.recentAuditLog.map((log, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className={cn("font-medium", auditActionColor(log.action))}>{auditActionLabel(log.action)}</span>
                          {log.reason && <p className="text-gray-400 text-xs truncate">{log.reason}</p>}
                          <p className="text-gray-400 text-xs">{format(new Date(log.createdAt), "MMM d, yyyy")} · {log.adminName}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* reports list */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                    <Flag className="w-4 h-4" />
                    Conduct Reports
                    <Badge variant="secondary" className={cn("ml-auto font-normal", p.totalReports > 0 ? "bg-red-50 text-red-600 border-red-100" : "")}>
                      {p.totalReports} total
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {p.reports.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No conduct reports on this patient.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {p.reports.map((r, i) => (
                        <div key={r.id} className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Flag className="w-3 h-3 text-red-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-700">Reported by {r.counselorName}</p>
                                <p className="text-xs text-gray-400">{format(new Date(r.createdAt), "MMM d, yyyy · h:mm a")}</p>
                              </div>
                            </div>
                          </div>
                          <div className="ml-8 bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-sm text-gray-600 leading-relaxed">{r.reason}</p>
                          </div>
                          {i < p.reports.length - 1 && <Separator className="mt-3" />}
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
