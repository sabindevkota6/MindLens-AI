"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldAlert,
  Layers,
  ScrollText,
  Bell,
  PauseCircle,
  AlertOctagon,
  Ban,
  Loader2,
  Search,
  Plus,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  UserCheck,
  Clock,
} from "lucide-react";
import {
  type PlatformSettingsData,
  type SpecialtyWithCount,
  type AuditLogEntry,
  updateEnforcementSettings,
  addSpecialty,
  deleteSpecialty,
  searchAuditLog,
} from "@/lib/actions/admin-settings";

// types 

type Props = {
  initialSettings: PlatformSettingsData | null;
  initialSpecialties: SpecialtyWithCount[];
};

type TabId = "enforcement" | "specialties" | "auditlog";

// helpers

// map action enum value to human-readable verb and color class
function actionMeta(action: string): { verb: string; colorClass: string; icon: React.ElementType; barClass: string } {
  switch (action) {
    case "BAN":
      return { verb: "permanently banned", colorClass: "text-red-600", icon: Ban, barClass: "bg-red-500" };
    case "UNBAN":
      return { verb: "unbanned", colorClass: "text-emerald-600", icon: ShieldCheck, barClass: "bg-emerald-500" };
    case "SUSPEND":
      return { verb: "suspended", colorClass: "text-amber-600", icon: Clock, barClass: "bg-amber-500" };
    case "UNSUSPEND":
      return { verb: "unsuspended", colorClass: "text-emerald-500", icon: CheckCircle, barClass: "bg-emerald-400" };
    case "VERIFY_COUNSELOR":
      return { verb: "verified", colorClass: "text-teal-600", icon: UserCheck, barClass: "bg-teal-500" };
    case "REVOKE_VERIFICATION":
      return { verb: "revoked verification for", colorClass: "text-orange-600", icon: ShieldAlert, barClass: "bg-orange-500" };
    default:
      return { verb: action.toLowerCase(), colorClass: "text-gray-600", icon: ShieldAlert, barClass: "bg-gray-400" };
  }
}

// target profile page url based on their role
function targetUrl(log: AuditLogEntry): string {
  if (log.targetRole === "COUNSELOR") return `/dashboard/admin/users/counselors/${log.targetEmail}`;
  return `/dashboard/admin/users/patients/${log.targetEmail}`;
}

// enforcement section

type EnforcementForm = {
  suspendWarnAt: number;
  autoSuspendAt: number;
  autoSuspendDays: number;
  banWarnAt: number;
  autoBanAt: number;
};

type ThresholdColumnProps = {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  ringColor: string;
  value: number;
  field: keyof Omit<EnforcementForm, "autoSuspendDays">;
  onChange: (field: keyof EnforcementForm, value: number) => void;
  hasError: boolean;
};

function ThresholdColumn({
  label,
  sublabel,
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  ringColor,
  value,
  field,
  onChange,
  hasError,
}: ThresholdColumnProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* colored icon circle */}
      <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      {/* label */}
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-700 leading-tight">{label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
      </div>

      {/* number input */}
      <div className="relative w-full">
        <input
          type="number"
          min={1}
          max={999}
          value={value}
          onChange={(e) => onChange(field, parseInt(e.target.value) || 0)}
          className={`
            w-full text-center text-2xl font-bold py-3 rounded-xl border-2 transition-colors outline-none
            focus:ring-2 focus:ring-offset-1
            ${hasError
              ? "border-red-400 bg-red-50 focus:ring-red-300"
              : `${borderColor} bg-white focus:ring-offset-0 ${ringColor}`
            }
            text-gray-900
          `}
        />
      </div>

      {/* caption */}
      <p className="text-[11px] text-gray-400 font-medium">reports / ratings</p>
    </div>
  );
}

function EnforcementSection({ initialSettings }: { initialSettings: PlatformSettingsData | null }) {
  const [form, setForm] = useState<EnforcementForm>({
    suspendWarnAt: initialSettings?.suspendWarnAt ?? 7,
    autoSuspendAt: initialSettings?.autoSuspendAt ?? 10,
    autoSuspendDays: initialSettings?.autoSuspendDays ?? 5,
    banWarnAt: initialSettings?.banWarnAt ?? 15,
    autoBanAt: initialSettings?.autoBanAt ?? 20,
  });
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // client-side ascending order check
  const isAscendingValid =
    form.suspendWarnAt < form.autoSuspendAt &&
    form.autoSuspendAt < form.banWarnAt &&
    form.banWarnAt < form.autoBanAt;

  const hasDaysError = form.autoSuspendDays < 1 || form.autoSuspendDays > 365;

  function handleChange(field: keyof EnforcementForm, value: number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSavedAt(null);
    setSaveError(null);
  }

  function handleSave() {
    if (!isAscendingValid || hasDaysError) return;
    setSaveError(null);

    startTransition(async () => {
      const result = await updateEnforcementSettings(form);
      if ("error" in result) {
        setSaveError(result.error);
        toast.error(result.error);
      } else {
        setSavedAt(new Date());
        toast.success("Enforcement thresholds saved.");
      }
    });
  }

  const columns = [
    {
      label: "Suspend Warning",
      sublabel: "First notice email",
      icon: Bell,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      borderColor: "border-amber-300",
      ringColor: "focus:ring-amber-200",
      field: "suspendWarnAt" as const,
    },
    {
      label: "Auto-Suspend",
      sublabel: "Account locked",
      icon: PauseCircle,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      borderColor: "border-orange-300",
      ringColor: "focus:ring-orange-200",
      field: "autoSuspendAt" as const,
    },
    {
      label: "Ban Warning",
      sublabel: "Final notice email",
      icon: AlertOctagon,
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      borderColor: "border-red-300",
      ringColor: "focus:ring-red-200",
      field: "banWarnAt" as const,
    },
    {
      label: "Auto-Ban",
      sublabel: "Permanent removal",
      icon: Ban,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
      borderColor: "border-rose-400",
      ringColor: "focus:ring-rose-200",
      field: "autoBanAt" as const,
    },
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Enforcement Thresholds</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Configure the report and 1-star review counts that trigger automated account actions. Applies to both patient reports and counselor ratings.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* gradient escalation track */}
        <div className="relative">
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 via-red-400 to-rose-600 mb-6" />

          {/* threshold columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {columns.map((col) => (
              <ThresholdColumn
                key={col.field}
                {...col}
                value={form[col.field]}
                onChange={handleChange}
                hasError={!isAscendingValid}
              />
            ))}
          </div>
        </div>

        {/* ascending order error */}
        {!isAscendingValid && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            Thresholds must be in strictly ascending order: Warn &lt; Auto-Suspend &lt; Final Warn &lt; Auto-Ban.
          </p>
        )}

        <div className="border-t border-gray-100 pt-5">
          {/* auto-suspend duration */}
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Auto-Suspend Duration</label>
              <p className="text-xs text-gray-400">
                When auto-suspend is triggered, accounts are locked for this many days.
              </p>
            </div>
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <input
                type="number"
                min={1}
                max={365}
                value={form.autoSuspendDays}
                onChange={(e) => handleChange("autoSuspendDays", parseInt(e.target.value) || 0)}
                className={`
                  w-20 text-center text-lg font-bold py-2.5 rounded-xl border-2 outline-none transition-colors
                  focus:ring-2 focus:ring-offset-1
                  ${hasDaysError
                    ? "border-red-400 bg-red-50 focus:ring-red-300"
                    : "border-amber-300 bg-white focus:ring-amber-200"
                  }
                  text-gray-900
                `}
              />
              <span className="text-sm text-gray-500 font-medium">days</span>
            </div>
          </div>

          {hasDaysError && (
            <p className="text-sm text-red-600 mt-2">Auto-suspend duration must be between 1 and 365 days.</p>
          )}
        </div>

        {/* save button + status */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={isPending || !isAscendingValid || hasDaysError}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>

          {savedAt && !saveError && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 flex-shrink-0">
              <Check className="w-4 h-4" />
              <span>Saved {format(savedAt, "h:mm a")}</span>
            </div>
          )}

          {saveError && (
            <p className="text-sm text-red-500 flex-shrink-0">{saveError}</p>
          )}
        </div>

        <p className="text-[11px] text-gray-400">
          Threshold changes take effect immediately on the next filed report or 1-star review.
        </p>
      </CardContent>
    </Card>
  );
}

// specialties section

function SpecialtiesSection({ initialSpecialties }: { initialSpecialties: SpecialtyWithCount[] }) {
  const [specialties, setSpecialties] = useState<SpecialtyWithCount[]>(initialSpecialties);
  const [newName, setNewName] = useState("");
  const [isAdding, startAddTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = specialties.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = specialties.filter((s) => s.counselorCount > 0).length;
  const unusedCount = specialties.filter((s) => s.counselorCount === 0).length;

  function handleAdd() {
    if (!newName.trim()) return;
    startAddTransition(async () => {
      const result = await addSpecialty(newName);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setSpecialties((prev) =>
          [...prev, result].sort((a, b) => a.name.localeCompare(b.name))
        );
        setNewName("");
        toast.success(`"${result.name}" added.`);
      }
    });
  }

  async function handleDelete(id: number, name: string) {
    setDeletingId(id);
    const result = await deleteSpecialty(id);
    setDeletingId(null);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      setSpecialties((prev) => prev.filter((s) => s.id !== id));
      toast.success(`"${name}" removed.`);
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Specialty Directory</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Manage the counselor specialty categories. Specialties with active counselors cannot be deleted.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* top action bar: search + add */}
        <div className="flex gap-3">
          {/* search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialties…"
              className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm"
            />
          </div>

          {/* add form */}
          <div className="flex gap-2 flex-shrink-0">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="New specialty…"
              className="w-44 rounded-xl border-gray-200 text-sm"
            />
            <Button
              onClick={handleAdd}
              disabled={isAdding || !newName.trim()}
              size="sm"
              className="rounded-xl bg-primary hover:bg-primary/90 text-white px-3"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* specialty list */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              {searchQuery ? (
                <>
                  <Search className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-500">No specialties match &quot;{searchQuery}&quot;</p>
                </>
              ) : (
                <>
                  <Layers className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-500">No specialties yet. Add the first one above.</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* colored dot */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${s.counselorCount > 0 ? "bg-primary" : "bg-gray-300"}`}
                  />

                  {/* specialty name */}
                  <span className="flex-1 text-sm font-medium text-gray-800">{s.name}</span>

                  {/* counselor count pill */}
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                      s.counselorCount > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {s.counselorCount} counselor{s.counselorCount !== 1 ? "s" : ""}
                  </span>

                  {/* delete button */}
                  <button
                    onClick={() => s.counselorCount === 0 && handleDelete(s.id, s.name)}
                    disabled={s.counselorCount > 0 || deletingId === s.id}
                    title={s.counselorCount > 0 ? `Used by ${s.counselorCount} counselor${s.counselorCount !== 1 ? "s" : ""}` : "Delete specialty"}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                      s.counselorCount > 0
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:text-red-600 hover:bg-red-50 text-gray-400"
                    }`}
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* stats footer */}
        <p className="text-xs text-gray-400 text-center">
          {specialties.length} specialties &middot; {activeCount} in use &middot; {unusedCount} unused
        </p>
      </CardContent>
    </Card>
  );
}

// audit log section

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "BAN", label: "Banned" },
  { value: "UNBAN", label: "Unbanned" },
  { value: "SUSPEND", label: "Suspended" },
  { value: "UNSUSPEND", label: "Unsuspended" },
  { value: "VERIFY_COUNSELOR", label: "Counselor Verified" },
  { value: "REVOKE_VERIFICATION", label: "Verification Revoked" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

function AuditLogSection() {
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month">("all");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [hasFetched, setHasFetched] = useState(false);

  // fetch audit log entries — runs in transition so ui stays responsive
  const fetchLogs = useCallback(
    (p: number) => {
      startTransition(async () => {
        const result = await searchAuditLog({ action: actionFilter, dateRange, page: p });
        if ("error" in result) {
          toast.error("Failed to load audit log.");
          return;
        }
        setLogs(result.logs);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
        setHasFetched(true);
      });
    },
    [actionFilter, dateRange]
  );

  // refetch when filters change
  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [fetchLogs]);

  // build ellipsis pagination pages array
  function getPages(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Admin Audit Log</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              A complete record of all admin enforcement actions performed on this platform.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* action type dropdown */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl text-sm px-4 py-2.5 pr-8 text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 cursor-pointer min-w-[160px]"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* date range dropdown */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as "all" | "week" | "month")}
              className="appearance-none bg-white border border-gray-200 rounded-xl text-sm px-4 py-2.5 pr-8 text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 cursor-pointer min-w-[130px]"
            >
              {DATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <span className="text-sm text-gray-400 ml-auto">
            {hasFetched ? `${total} entr${total === 1 ? "y" : "ies"}` : ""}
          </span>
        </div>

        {/* log list */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {/* skeleton while loading first fetch */}
          {isPending && !hasFetched ? (
            <div className="divide-y divide-gray-50 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-1 self-stretch rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-3 bg-gray-200 rounded hidden md:block" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <ScrollText className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-500">No audit log entries found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log, idx) => {
                const meta = actionMeta(log.action);
                const ActionIcon = meta.icon;
                const isAuto = log.metadata?.auto === true;
                const createdDate = new Date(log.createdAt);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors animate-in fade-in"
                    style={{ animationDelay: `${idx * 25}ms` }}
                  >
                    {/* left colored bar */}
                    <div className={`w-1 self-stretch rounded-full ${meta.barClass} flex-shrink-0`} />

                    {/* action icon circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${meta.barClass} bg-opacity-15`}
                      style={{ backgroundColor: `color-mix(in srgb, currentColor 0%, transparent)` }}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${meta.barClass.replace("bg-", "bg-").replace("-500", "-100").replace("-400", "-100")}`}>
                        <ActionIcon className={`w-3.5 h-3.5 ${meta.colorClass}`} />
                      </div>
                    </div>

                    {/* event text */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm text-gray-700 leading-snug">
                        <span className="font-semibold text-gray-900">
                          {log.adminName ?? log.adminEmail}
                        </span>
                        {" "}
                        <span className={`font-medium ${meta.colorClass}`}>{meta.verb}</span>
                        {" "}
                        <Link
                          href={targetUrl(log)}
                          className="font-semibold text-gray-900 hover:text-primary transition-colors underline-offset-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {log.targetName ?? log.targetEmail}
                        </Link>
                        {isAuto && (
                          <span className="ml-2 text-[11px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md font-medium">
                            auto
                          </span>
                        )}
                      </p>

                      {log.reason && (
                        <p className="text-xs text-gray-400 line-clamp-1">{log.reason}</p>
                      )}
                    </div>

                    {/* date column */}
                    <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(createdDate, { addSuffix: true })}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {format(createdDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => { setPage(page - 1); fetchLogs(page - 1); }}
              disabled={page <= 1 || isPending}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPages().map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="w-8 text-center text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => { setPage(p as number); fetchLogs(p as number); }}
                    disabled={isPending}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => { setPage(page + 1); fetchLogs(page + 1); }}
              disabled={page >= totalPages || isPending}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// main panel

const TABS: { id: TabId; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "enforcement", label: "Enforcement Rules",   desc: "Report & rating thresholds",  icon: ShieldAlert  },
  { id: "specialties", label: "Specialty Directory", desc: "Manage counselor categories", icon: Layers       },
  { id: "auditlog",    label: "Admin Audit Log",     desc: "Action history & trail",       icon: ScrollText   },
];

export function AdminSettingsPanel({ initialSettings, initialSpecialties }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("enforcement");

  return (
    <div className="flex gap-6 items-start">
      {/* left sidebar nav */}
      <div className="w-52 shrink-0 sticky top-24 bg-white rounded-2xl shadow-sm p-2 space-y-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-colors
                ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }
              `}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? "text-primary" : "text-gray-400"}`} />
              <div>
                <p className={`text-sm font-medium leading-tight ${isActive ? "text-primary" : "text-gray-800"}`}>
                  {tab.label}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{tab.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* right content area */}
      <div className="flex-1 min-w-0">
        {activeTab === "enforcement" && (
          <EnforcementSection initialSettings={initialSettings} />
        )}
        {activeTab === "specialties" && (
          <SpecialtiesSection initialSpecialties={initialSpecialties} />
        )}
        {activeTab === "auditlog" && (
          <AuditLogSection />
        )}
      </div>
    </div>
  );
}
