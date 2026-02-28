"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  searchCounselors,
  getAllSpecialties,
  type CounselorCard,
  type SearchCounselorsParams,
} from "@/lib/actions/counselor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  Star,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ShieldCheck,
  Clock,
  ArrowUpDown,
  X,
  Loader2,
  LayoutGrid,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Specialty {
  id: number;
  name: string;
}

export function FindCounselors() {
  const router = useRouter();
  const [counselors, setCounselors] = useState<CounselorCard[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [query, setQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateLabel, setDateLabel] = useState("");
  const [minRating, setMinRating] = useState<string>("");
  const [minExperience, setMinExperience] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load specialties on mount
  useEffect(() => {
    getAllSpecialties().then(setSpecialties);
  }, []);

  const fetchCounselors = useCallback(
    (pageNum: number = 1) => {
      startTransition(async () => {
        const params: SearchCounselorsParams = {
          page: pageNum,
          perPage: 6,
        };

        if (query.trim()) params.query = query.trim();
        if (selectedSpecialty && selectedSpecialty !== "all")
          params.specialtyId = Number(selectedSpecialty);
        if (selectedDate) params.availabilityDate = selectedDate.toISOString();
        if (minRating && minRating !== "any")
          params.minRating = Number(minRating);
        if (minExperience && minExperience !== "any")
          params.minExperience = Number(minExperience);
        if (sortBy === "rating" || sortBy === "experience") {
          params.sortBy = sortBy;
          params.sortOrder = "desc";
        }

        const result = await searchCounselors(params);
        setCounselors(result.counselors);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      });
    },
    [query, selectedSpecialty, selectedDate, minRating, minExperience, sortBy]
  );

  // Fetch on filter changes
  useEffect(() => {
    fetchCounselors(1);
  }, [fetchCounselors]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCounselors(1);
  };

  const handleQuickDate = (option: "today" | "tomorrow" | "week") => {
    const now = new Date();
    if (option === "today") {
      setSelectedDate(now);
      setDateLabel("Today");
    } else if (option === "tomorrow") {
      const tmr = new Date(now);
      tmr.setDate(tmr.getDate() + 1);
      setSelectedDate(tmr);
      setDateLabel("Tomorrow");
    } else {
      // "this week" — use today's date, handled in backend as range if needed
      setSelectedDate(now);
      setDateLabel("This Week");
    }
    setCalendarOpen(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setDateLabel("");
  };

  const clearAllFilters = () => {
    setQuery("");
    setSelectedSpecialty("");
    setSelectedDate(undefined);
    setDateLabel("");
    setMinRating("");
    setMinExperience("");
    setSortBy("");
  };

  const hasActiveFilters =
    query ||
    (selectedSpecialty && selectedSpecialty !== "all") ||
    selectedDate ||
    (minRating && minRating !== "any") ||
    (minExperience && minExperience !== "any") ||
    (sortBy && sortBy !== "default");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent avatar color from counselor name
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

  const formatNextAvailable = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    // Check if within this week
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

    if (isToday) return "Available Today";
    if (isTomorrow) return "Available Tomorrow";
    if (date <= endOfWeek) return "Available This Week";
    return `Available ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  };

  return (
    <section id="find-counselors" className="px-3 sm:px-4 lg:px-6 py-16 bg-gray-50">
      <div className="max-w-[90rem] mx-auto space-y-8">

        {/* Green Search & Filters Card */}
        <Card className="border-0 shadow-sm bg-primary overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Find Counselors</h2>
                <p className="text-white/80 mt-1">
                  Browse verified professionals and book your session
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-white/80 hover:text-white hover:bg-white/10 self-start sm:self-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </Button>
              )}
            </div>

            {/* Search Row */}
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or specialty..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-11 bg-white border-0 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </Button>
            </form>

            {/* Expandable Filters */}
            {filtersOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-white/20">
                {/* Specialty Filter */}
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="h-10 w-full bg-white border-0 text-gray-700">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                      <SelectValue placeholder="All Specialties" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Availability Date */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 w-full justify-start text-left font-normal bg-white border-0 text-gray-700",
                        !selectedDate && "text-gray-500"
                      )}
                    >
                      <CalendarDays className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {dateLabel || "Availability"}
                      </span>
                      {selectedDate && (
                        <X
                          className="w-3.5 h-3.5 ml-auto flex-shrink-0 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearDateFilter();
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">
                        Choose your preferred date to see available counselors on that date:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleQuickDate("today")}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Available Today
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleQuickDate("tomorrow")}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Available Tomorrow
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleQuickDate("week")}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Available This Week
                        </Button>
                      </div>
                    </div>
                    <Calendar
                      className="mx-auto"
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          setDateLabel(
                            date.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          );
                        }
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Rating Filter */}
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="h-10 w-full bg-white border-0 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 flex-shrink-0" />
                      <SelectValue placeholder="Min Rating" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Rating</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                    <SelectItem value="1">1+ Stars</SelectItem>
                  </SelectContent>
                </Select>

                {/* Experience Filter */}
                <Select value={minExperience} onValueChange={setMinExperience}>
                  <SelectTrigger className="h-10 w-full bg-white border-0 text-gray-700">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                      <SelectValue placeholder="Experience" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Experience</SelectItem>
                    <SelectItem value="1">1+ Years</SelectItem>
                    <SelectItem value="3">3+ Years</SelectItem>
                    <SelectItem value="5">5+ Years</SelectItem>
                    <SelectItem value="10">10+ Years</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 w-full bg-white border-0 text-gray-700">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <SelectValue placeholder="Sort By" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Results Count */}
            <p className="text-sm text-white/80">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {counselors.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">{total}</span>{" "}
                  counselors
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Counselor Cards Grid */}
        {isPending ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-0 shadow-sm animate-pulse rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gray-100 flex flex-col items-center pt-8 pb-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200" />
                  </div>
                  <div className="px-6 pt-4 pb-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-16" />
                      <div className="h-6 bg-gray-200 rounded-full w-16" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-2/5" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-11 bg-gray-200 rounded-xl mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : counselors.length === 0 ? (
          <Card className="border-0 shadow-sm max-w-7xl mx-auto">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No counselors found
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Try adjusting your search or filters to find available counselors.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counselors.map((counselor) => {
              const avatarColor = getAvatarColor(counselor.fullName);
              const availability = formatNextAvailable(counselor.nextAvailable);

              return (
                <Card
                  key={counselor.id}
                  className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group rounded-2xl py-0"
                >
                  <CardContent className="p-0">
                    {/* Avatar Section - mint green background */}
                    <div className="relative flex flex-col items-center pt-8 pb-5 bg-teal-50">
                      {/* Verified Badge - top right */}
                      {counselor.verificationStatus === "VERIFIED" && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary text-white text-xs font-medium px-2.5 py-1 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </div>
                      )}

                      {/* Circular Avatar */}
                      <div
                        className={cn(
                          "w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold ring-4",
                          avatarColor.bg,
                          avatarColor.ring,
                          avatarColor.text
                        )}
                      >
                        {getInitials(counselor.fullName)}
                      </div>
                    </div>

                    {/* Name & Professional Title */}
                    <div className="px-6 pt-5 pb-2 space-y-0.5">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {counselor.fullName}
                      </h3>
                      {counselor.professionalTitle && (
                        <p className="text-sm text-gray-500">
                          {counselor.professionalTitle}
                        </p>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="px-6 pb-3">
                      <div className="flex items-center gap-1.5">
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
                    </div>

                    {/* Specialty Badges */}
                    {counselor.specialties.length > 0 && (
                      <div className="px-6 pb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {counselor.specialties.slice(0, 3).map((spec) => (
                            <Badge
                              key={spec}
                              variant="secondary"
                              className="bg-primary/8 text-primary border border-primary/15 text-xs font-normal px-3 py-0.5 rounded-full"
                            >
                              {spec}
                            </Badge>
                          ))}
                          {counselor.specialties.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-500 border-0 text-xs font-normal px-3 py-0.5 rounded-full"
                            >
                              +{counselor.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="mx-6 border-t border-gray-100" />

                    {/* Experience */}
                    <div className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{counselor.experienceYears} years experience</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-6 border-t border-gray-100" />

                    {/* Availability */}
                    <div className="px-6 py-4">
                      {availability ? (
                        <p className="text-sm font-medium text-primary">
                          {availability}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">
                          No slots available
                        </p>
                      )}
                    </div>

                    {/* Book Session Button */}
                    <div className="px-6 pb-6">
                      <Button
                        onClick={() => router.push(`/dashboard/patient/counselor/${counselor.id}`)}
                        className="w-full h-11 rounded-xl font-semibold text-sm"
                      >
                        Book Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => fetchCounselors(page - 1)}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 5) return true;
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - page) <= 1;
                })
                .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) {
                    acc.push("ellipsis");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "ellipsis" ? (
                    <span key={`e-${i}`} className="px-2 text-gray-400">
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={page === item ? "default" : "outline"}
                      size="sm"
                      className="w-9 h-9 p-0"
                      disabled={isPending}
                      onClick={() => fetchCounselors(item)}
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
              onClick={() => fetchCounselors(page + 1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
