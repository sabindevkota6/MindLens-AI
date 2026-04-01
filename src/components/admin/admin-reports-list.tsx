"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  searchAdminReports,
  type AdminReportListItem,
  type AtRiskPatient,
} from "@/lib/actions/admin-reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Clock,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Loader2,
  ArrowUpDown,
  Flag,
  AlertTriangle,
  ShieldCheck,
  CalendarDays,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function getAvatarColor(name: string) {
  const colors = [
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-violet-100", text: "text-violet-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-slate-100", text: "text-slate-700" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// left bar color reflects patient risk tier at a glance
function riskBarColor(count: number) {
  if (count >= 15) return "bg-red-400";
  if (count >= 7) return "bg-amber-400";
  return "bg-gray-200";
}

// badge style for report count chip
function reportCountBadgeClass(count: number) {
  if (count >= 15) return "text-red-600 bg-red-50 border-red-100";
  if (count >= 7) return "text-amber-600 bg-amber-50 border-amber-100";
  return "text-gray-500 bg-gray-50 border-gray-100";
}

// ── at-risk row subcomponent ──────────────────────────────────────────────────

function AtRiskRow({
  patient,
  tier,
}: {
  patient: AtRiskPatient;
  tier: "high" | "warning";
}) {
  const avatar = getAvatarColor(patient.fullName);
  const indicatorColor = tier === "high" ? "bg-red-400" : "bg-amber-400";

  return (
    <div className="flex items-center gap-3 py-2.5">
      {/* colored tier indicator */}
      <div className={cn("w-1 self-stretch rounded-full flex-shrink-0 min-h-[36px]", indicatorColor)} />

      {/* avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
          avatar.bg,
          avatar.text
        )}
      >
        {getInitials(patient.fullName)}
      </div>

      {/* name + status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{patient.fullName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {patient.isBanned ? (
            <span className="flex items-center gap-1 text-[10px] font-medium bg-red-100 text-red-700 border border-red-200 rounded-full px-1.5 py-0.5">
              <Ban className="w-2.5 h-2.5" />Banned
            </span>
          ) : patient.isSuspended ? (
            <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">
              <Clock className="w-2.5 h-2.5" />Suspended
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5">
              <CheckCircle className="w-2.5 h-2.5" />Active
            </span>
          )}
        </div>
      </div>

      {/* report count badge */}
      <span
        className={cn(
          "flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 flex-shrink-0",
          reportCountBadgeClass(patient.totalReports)
        )}
      >
        {patient.totalReports >= 7 && <AlertTriangle className="w-3 h-3" />}
        {patient.totalReports}
      </span>

      {/* view link */}
      <Link
        href={`/dashboard/admin/users/patients/${patient.patientId}`}
        className="text-xs text-primary font-medium hover:underline flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        View
      </Link>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

interface AdminReportsListProps {
  atRiskPatients: AtRiskPatient[];
}

export function AdminReportsList({ atRiskPatients }: AdminReportsListProps) {
  const router = useRouter();

  // filter state
  const [query, setQuery] = useState("");
  const [riskLevel, setRiskLevel] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // data state
  const [reports, setReports] = useState<AdminReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();

  // search reports with optional filters — runs in transition so ui stays responsive
  const fetchReports = useCallback(
    (p: number = 1) => {
      startTransition(async () => {
        const result = await searchAdminReports({
          query: query.trim() || undefined,
          riskLevel: riskLevel as "all" | "clean" | "warning" | "highrisk",
          dateRange: dateRange as "all" | "week" | "month",
          sortBy: sortBy as "newest" | "mostReported",
          page: p,
        });
        if ("error" in result) return;
        setReports(result.reports);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      });
    },
    [query, riskLevel, dateRange, sortBy]
  );

  // refetch whenever filters change
  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const hasFilters =
    query ||
    riskLevel !== "all" ||
    dateRange !== "all" ||
    sortBy !== "newest";

  function clearFilters() {
    setQuery("");
    setRiskLevel("all");
    setDateRange("all");
    setSortBy("newest");
  }

  // split at-risk patients into their tiers for the panel
  const highRiskPatients = atRiskPatients.filter((p) => p.totalReports >= 15);
  const warningPatients = atRiskPatients.filter(
    (p) => p.totalReports >= 7 && p.totalReports < 15
  );

  return (
    <div className="space-y-5">

      {/* ── search + filter card ── */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by patient or counselor name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <Button
              variant="outline"
              className={cn(
                "h-10 gap-2 border-gray-200",
                filtersOpen && "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white"
              )}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 gap-1 h-10"
              >
                <X className="w-3.5 h-3.5" />Clear
              </Button>
            )}
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              {/* risk level filter */}
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder="Risk Level" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="clean">Clean (0–6 reports)</SelectItem>
                  <SelectItem value="warning">Warning (7–14)</SelectItem>
                  <SelectItem value="highrisk">High Risk (15+)</SelectItem>
                </SelectContent>
              </Select>

              {/* date range filter */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder="Date Range" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {/* sort order */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder="Sort By" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="mostReported">Most Reported</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* result counter */}
          <p className="text-xs text-gray-400">
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Searching...
              </span>
            ) : (
              <span>Showing {reports.length} of {total} reports</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* ── report rows ── */}
      {isPending ? (
        // skeleton — 6 rows matching the real row structure
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0 divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-1 self-stretch rounded-full bg-gray-200 min-h-[52px] flex-shrink-0" />
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="w-[160px] flex-shrink-0 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="flex-1 hidden sm:block space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="w-[180px] hidden md:block space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-4/5" />
                  <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        // empty state
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No reports found</p>
            <p className="text-sm text-gray-400 mt-1">
              {total === 0
                ? "No conduct reports have been filed yet."
                : "Try adjusting your search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        // single card with divider rows — not a card grid
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-gray-50">
            {reports.map((r, i) => {
              const avatar = getAvatarColor(r.patientName);
              return (
                <div
                  key={r.reportId}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50/80 transition-colors cursor-pointer group animate-in fade-in"
                  style={{ animationDelay: `${i * 20}ms` }}
                  onClick={() =>
                    router.push(`/dashboard/admin/users/patients/${r.patientId}`)
                  }
                >
                  {/* left bar — risk tier indicator */}
                  <div
                    className={cn(
                      "w-1 self-stretch rounded-full flex-shrink-0 min-h-[52px]",
                      riskBarColor(r.patientTotalReports)
                    )}
                  />

                  {/* patient block */}
                  <div className="w-[170px] flex-shrink-0 flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                        avatar.bg,
                        avatar.text
                      )}
                    >
                      {getInitials(r.patientName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* patient name — stop propagation so row click doesn't double-fire */}
                      <Link
                        href={`/dashboard/admin/users/patients/${r.patientId}`}
                        className="text-sm font-semibold text-gray-900 truncate block hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.patientName}
                      </Link>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {/* account status chip */}
                        {r.patientIsBanned ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-red-100 text-red-700 border border-red-200 rounded-full px-1.5 py-0.5">
                            <Ban className="w-2.5 h-2.5" />Banned
                          </span>
                        ) : r.patientIsSuspended ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">
                            <Clock className="w-2.5 h-2.5" />Suspended
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5">
                            <CheckCircle className="w-2.5 h-2.5" />Active
                          </span>
                        )}
                        {/* report count chip — risk-colored */}
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-[10px] font-medium border rounded-full px-1.5 py-0.5",
                            reportCountBadgeClass(r.patientTotalReports)
                          )}
                        >
                          {r.patientTotalReports >= 7 && (
                            <AlertTriangle className="w-2.5 h-2.5" />
                          )}
                          {r.patientTotalReports < 7 && (
                            <Flag className="w-2.5 h-2.5" />
                          )}
                          {r.patientTotalReports}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* report reason — hidden on mobile */}
                  <div className="flex-1 hidden sm:block min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-2 leading-snug">
                      {r.reason}
                    </p>
                  </div>

                  {/* counselor + date — hidden on mobile */}
                  <div className="w-[190px] hidden md:block flex-shrink-0 text-right">
                    <p className="text-xs text-gray-500 truncate">
                      Filed by{" "}
                      <Link
                        href={`/dashboard/admin/users/counselors/${r.counselorId}`}
                        className="font-medium text-gray-700 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.counselorName}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(r.appointmentSlotStart), "MMM d, yyyy · h:mm a")}
                    </p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {format(new Date(r.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>

                  {/* view patient button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 gap-1.5 text-xs h-8 border-gray-200 hover:border-primary hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/dashboard/admin/users/patients/${r.patientId}`
                      );
                    }}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">View Patient</span>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => fetchReports(page - 1)}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  totalPages <= 5 ||
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1
              )
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "…" ? (
                  <span key={`e${i}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={page === item ? "default" : "outline"}
                    size="sm"
                    className="w-9 h-9 p-0"
                    disabled={isPending}
                    onClick={() => fetchReports(item)}
                  >
                    {item}
                  </Button>
                )
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => fetchReports(page + 1)}
            className="gap-1"
          >
            Next<ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ── at-risk patients panel ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-base">At-Risk Patients</CardTitle>
          </div>
          <CardDescription>
            Patients approaching auto-enforcement thresholds who are not yet banned
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {atRiskPatients.length === 0 ? (
            // empty state — all clear
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-emerald-600">All clear</p>
              <p className="text-xs text-gray-400 mt-1">
                No patients approaching enforcement thresholds
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1">
              {/* high risk column */}
              <div>
                {highRiskPatients.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                      High Risk — ≥15 reports
                    </p>
                    <div className="divide-y divide-gray-50">
                      {highRiskPatients.map((p) => (
                        <AtRiskRow key={p.patientId} patient={p} tier="high" />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* at-risk / warning column */}
              <div>
                {warningPatients.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      At Risk — 7–14 reports
                    </p>
                    <div className="divide-y divide-gray-50">
                      {warningPatients.map((p) => (
                        <AtRiskRow key={p.patientId} patient={p} tier="warning" />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
