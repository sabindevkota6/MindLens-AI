"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  searchAdminCounselors,
  type AdminCounselorListItem,
} from "@/lib/actions/admin-user-management";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Star,
  ShieldCheck,
  Clock,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Loader2,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const avatarColor = { bg: "bg-primary/10", text: "text-primary" };

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// account status badge
function AccountBadge({ isBanned, isSuspended }: { isBanned: boolean; isSuspended: boolean }) {
  if (isBanned) return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-[10px]"><Ban className="w-2.5 h-2.5" />Banned</Badge>;
  if (isSuspended) return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 text-[10px]"><Clock className="w-2.5 h-2.5" />Suspended</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 text-[10px]"><CheckCircle className="w-2.5 h-2.5" />Active</Badge>;
}

// verification status badge
function VerifBadge({ status }: { status: string }) {
  if (status === "VERIFIED") return <Badge className="bg-teal-100 text-teal-700 border-teal-200 gap-1 text-[10px]"><ShieldCheck className="w-2.5 h-2.5" />Verified</Badge>;
  if (status === "REJECTED") return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Pending</Badge>;
}

interface AdminCounselorsListProps {
  initialData: { counselors: AdminCounselorListItem[]; total: number; page: number; totalPages: number };
  initialParams: { query: string; verificationStatus: string; accountStatus: string; sortBy: string; page: number };
}

export function AdminCounselorsList({ initialData, initialParams }: AdminCounselorsListProps) {
  const router = useRouter();
  const [counselors, setCounselors] = useState(initialData.counselors);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isPending, startTransition] = useTransition();

  // filter state
  const [query, setQuery] = useState(initialParams.query);
  const [verificationStatus, setVerificationStatus] = useState(initialParams.verificationStatus);
  const [accountStatus, setAccountStatus] = useState(initialParams.accountStatus);
  const [sortBy, setSortBy] = useState(initialParams.sortBy);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetch = useCallback(
    (p: number = 1) => {
      startTransition(async () => {
        const result = await searchAdminCounselors({
          query: query.trim() || undefined,
          verificationStatus: verificationStatus as "PENDING" | "VERIFIED" | "REJECTED" | "all",
          accountStatus: accountStatus as "active" | "suspended" | "banned" | "all",
          sortBy: sortBy as "registeredAt" | "popularity" | "rating" | "experience",
          page: p,
        });
        if ("error" in result) return;
        setCounselors(result.counselors);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      });
    },
    [query, verificationStatus, accountStatus, sortBy]
  );

  useEffect(() => { fetch(1); }, [fetch]);

  const hasFilters = query || verificationStatus !== "all" || accountStatus !== "all" || sortBy !== "registeredAt";

  function clearFilters() {
    setQuery("");
    setVerificationStatus("all");
    setAccountStatus("all");
    setSortBy("registeredAt");
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
                placeholder="Search by name, title, email or specialty..."
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
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder="Verification" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder="Sort By" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registeredAt">Registered Date</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="text-xs text-gray-400">
            {isPending ? (
              <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Searching...</span>
            ) : (
              <span>Showing {counselors.length} of {total} counselors</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* counselor cards grid — mirrors patient browse card style */}
      {isPending ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gray-100 h-28 flex flex-col items-center pt-6 pb-3">
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="flex gap-1.5 mt-2">
                    <div className="h-5 w-14 bg-gray-200 rounded-full" />
                    <div className="h-5 w-14 bg-gray-200 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : counselors.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No counselors found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {counselors.map((c, i) => {
            const avatar = avatarColor;
            return (
              <Card
                key={c.id}
                className="border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 rounded-2xl overflow-hidden cursor-pointer group py-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => router.push(`/dashboard/admin/users/counselors/${c.id}`)}
              >
                <CardContent className="p-0">
                  {/* avatar band — same teal-50 as patient browse view */}
                  <div className="relative flex flex-col items-center pt-7 pb-4 bg-teal-50">
                    {c.verificationStatus === "VERIFIED" && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-primary text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />Verified
                      </div>
                    )}
                    {(c.isBanned || c.isSuspended) && (
                      <div className={cn(
                        "absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
                        c.isBanned ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                      )}>
                        {c.isBanned ? <Ban className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {c.isBanned ? "Banned" : "Suspended"}
                      </div>
                    )}
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.fullName}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-white"
                      />
                    ) : (
                      <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ring-4 ring-white", avatar.bg, avatar.text)}>
                        {getInitials(c.fullName)}
                      </div>
                    )}
                  </div>

                  <div className="px-4 pt-3 pb-4 space-y-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">{c.fullName}</p>
                      {c.professionalTitle && <p className="text-xs text-gray-400 truncate">{c.professionalTitle}</p>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold text-gray-700">{c.avgRating > 0 ? c.avgRating.toFixed(1) : "New"}</span>
                      {c.totalReviews > 0 && <span className="text-xs text-gray-400">({c.totalReviews})</span>}
                      {c.oneStarCount >= 7 && (
                        <span className="ml-auto" aria-label={`${c.oneStarCount} one-star reviews`}>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                    </div>

                    {c.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.specialties.slice(0, 2).map((s) => (
                          <span key={s} className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 rounded-full px-2 py-0.5">{s}</span>
                        ))}
                        {c.specialties.length > 2 && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">+{c.specialties.length - 2}</span>
                        )}
                      </div>
                    )}

                    <div className="pt-1 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">{c.totalAppointments} sessions · {c.experienceYears}y exp</span>
                      <span className="text-[10px] text-gray-400">{format(new Date(c.registeredAt), "MMM yyyy")}</span>
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
