"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  searchAdminPatients,
  type AdminPatientListItem,
} from "@/lib/actions/admin-user-management";
import { Card, CardContent } from "@/components/ui/card";
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
  CalendarDays,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AdminPatientsListProps {
  initialData: { patients: AdminPatientListItem[]; total: number; page: number; totalPages: number };
  initialParams: { query: string; accountStatus: string; reportedStatus: string; sortBy: string; page: number };
}

export function AdminPatientsList({ initialData, initialParams }: AdminPatientsListProps) {
  const router = useRouter();
  const [patients, setPatients] = useState(initialData.patients);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialParams.query);
  const [accountStatus, setAccountStatus] = useState(initialParams.accountStatus);
  const [reportedStatus, setReportedStatus] = useState(initialParams.reportedStatus);
  const [sortBy, setSortBy] = useState(initialParams.sortBy);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetch = useCallback(
    (p: number = 1) => {
      startTransition(async () => {
        const result = await searchAdminPatients({
          query: query.trim() || undefined,
          accountStatus: accountStatus as "active" | "suspended" | "banned" | "all",
          reportedStatus: reportedStatus as "reported" | "unreported" | "all",
          sortBy: sortBy as "registeredAt" | "activeness" | "mostReported",
          page: p,
        });
        if ("error" in result) return;
        setPatients(result.patients);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      });
    },
    [query, accountStatus, reportedStatus, sortBy]
  );

  useEffect(() => { fetch(1); }, [fetch]);

  const hasFilters = query || accountStatus !== "all" || reportedStatus !== "all" || sortBy !== "registeredAt";

  function clearFilters() {
    setQuery("");
    setAccountStatus("all");
    setReportedStatus("all");
    setSortBy("registeredAt");
  }

  // determine report risk color for the count badge
  function reportRiskColor(count: number) {
    if (count >= 15) return "text-red-600 bg-red-50 border-red-100";
    if (count >= 7) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-gray-500 bg-gray-50 border-gray-100";
  }

  return (
    <div className="space-y-5">
      {/* search + filter card */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email or bio..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <Button
              variant="outline"
              className={cn("h-10 gap-2 border-gray-200", filtersOpen && "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white")}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 gap-1 h-10">
                <X className="w-3.5 h-3.5" />Clear
              </Button>
            )}
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <Select value={accountStatus} onValueChange={setAccountStatus}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder="Account Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={reportedStatus} onValueChange={setReportedStatus}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <div className="flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder="Report Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="reported">Has Reports</SelectItem>
                  <SelectItem value="unreported">No Reports</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder="Sort By" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registeredAt">Registered Date</SelectItem>
                  <SelectItem value="activeness">Most Active</SelectItem>
                  <SelectItem value="mostReported">Most Reported</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="text-xs text-gray-400">
            {isPending ? (
              <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Searching...</span>
            ) : (
              <span>Showing {patients.length} of {total} patients</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* patient cards */}
      {isPending ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse rounded-2xl overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No patients found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {patients.map((p, i) => {
            const avatar = getAvatarColor(p.fullName);
            return (
              <Card
                key={p.id}
                className="border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 rounded-2xl overflow-hidden cursor-pointer group animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => router.push(`/dashboard/admin/users/patients/${p.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* avatar + name row */}
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0", avatar.bg, avatar.text)}>
                      {getInitials(p.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">{p.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{p.email}</p>
                    </div>
                  </div>

                  {/* account status chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {p.isBanned ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                        <Ban className="w-2.5 h-2.5" />Banned
                      </span>
                    ) : p.isSuspended ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                        <Clock className="w-2.5 h-2.5" />Suspended
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                        <CheckCircle className="w-2.5 h-2.5" />Active
                      </span>
                    )}

                    {p.totalReports > 0 && (
                      <span className={cn("flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5", reportRiskColor(p.totalReports))}>
                        {p.totalReports >= 7 && <AlertTriangle className="w-2.5 h-2.5" />}
                        {!p.totalReports || p.totalReports < 7 ? <Flag className="w-2.5 h-2.5" /> : null}
                        {p.totalReports} report{p.totalReports !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* stats row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Activity className="w-3 h-3 text-gray-300" />
                      {p.totalAppointments} sessions
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <CalendarDays className="w-3 h-3 text-gray-300" />
                      {format(new Date(p.registeredAt), "MMM yyyy")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => fetch(page - 1)} className="gap-1">
            <ChevronLeft className="w-4 h-4" />Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => totalPages <= 5 || p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "…" ? (
                  <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <Button key={item} variant={page === item ? "default" : "outline"} size="sm" className="w-9 h-9 p-0" disabled={isPending} onClick={() => fetch(item)}>
                    {item}
                  </Button>
                )
              )}
          </div>
          <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => fetch(page + 1)} className="gap-1">
            Next<ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
