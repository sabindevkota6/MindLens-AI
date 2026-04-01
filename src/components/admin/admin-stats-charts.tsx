"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import {
  Users,
  UserCheck,
  Calendar,
  Wallet,
  Star,
  Brain,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Ban,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Clock,
  PieChart as PieChartIcon,
  BarChart2,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { AdminStats } from "@/lib/actions/admin-stats";

// chart color configs
const userRegistrationConfig = {
  patients: { label: "Patients", color: "#00796B" },
  counselors: { label: "Counselors", color: "#7C4DFF" },
} satisfies ChartConfig;

const appointmentTrendConfig = {
  completed: { label: "Completed", color: "#00796B" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  missed: { label: "Missed", color: "#f59e0b" },
  scheduled: { label: "Scheduled", color: "#00BCD4" },
} satisfies ChartConfig;

const specialtiesConfig = {
  count: { label: "Counselors", color: "#00796B" },
} satisfies ChartConfig;

const emotionsConfig = {
  count: { label: "Sessions", color: "#7C4DFF" },
} satisfies ChartConfig;

// format "2025-01" to "Jan '25"
function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return format(date, "MMM ''yy");
}

// simple star display
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

// empty state for charts that have no data yet
function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
      <TrendingUp className="w-10 h-10 mb-3 text-gray-300" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs mt-1 text-gray-400">Data will appear as activity grows</p>
    </div>
  );
}

// reusable kpi stat card
function StatCard({
  icon,
  label,
  value,
  subtitle,
  bgAccent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  bgAccent: string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
              {value}
            </p>
            <p className="text-xs text-gray-400 leading-snug">{subtitle}</p>
          </div>
          <div
            className={`w-11 h-11 rounded-xl ${bgAccent} flex items-center justify-center flex-shrink-0 ml-3`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// mini colored badge stat used at the bottom row
function MiniStat({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${bg}`}>
      <div className={color}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export function AdminStatsCharts({ data }: { data: AdminStats }) {
  // pre-format monthly data labels for charts
  const monthlyUserData = data.monthlyUserRegistrations.map((d) => ({
    ...d,
    name: formatMonth(d.month),
  }));

  const monthlyApptData = data.monthlyAppointmentTrends.map((d) => ({
    ...d,
    name: formatMonth(d.month),
  }));

  const hasMonthlyUsers = monthlyUserData.length > 0;
  const hasMonthlyAppts = monthlyApptData.length > 0;
  const hasVerifData = data.counselorVerificationBreakdown.length > 0;
  const hasStatusData = data.appointmentStatusDistribution.length > 0;
  const hasSpecialties = data.topSpecialties.length > 0;
  const hasEmotions = data.dominantEmotions.length > 0;
  const hasTopCounselors = data.topCounselors.length > 0;
  const hasReports = data.recentReports.length > 0;

  return (
    <div className="space-y-5">

      {/* ── section A: kpi cards ── */}
      {/* row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-primary" />}
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
          subtitle={`+${data.newUsersThisMonth} this month`}
          bgAccent="bg-primary/8"
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          label="Active Counselors"
          value={data.activeCounselors.toString()}
          subtitle={`${data.pendingCounselors} pending · ${data.rejectedCounselors} rejected`}
          bgAccent="bg-emerald-50"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-primary" />}
          label="Total Appointments"
          value={data.totalAppointments.toLocaleString()}
          subtitle={`${data.scheduledAppointments} scheduled`}
          bgAccent="bg-primary/8"
        />
        <StatCard
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          label="Platform Revenue"
          value={`NPR ${data.platformRevenue.toLocaleString()}`}
          subtitle="approx · 1 hr per session"
          bgAccent="bg-emerald-50"
        />
      </div>

      {/* row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Star className="w-5 h-5 text-amber-500" />}
          label="Avg Platform Rating"
          value={data.avgPlatformRating > 0 ? data.avgPlatformRating.toFixed(1) : "N/A"}
          subtitle={`${data.totalReviews} reviews`}
          bgAccent="bg-amber-50"
        />
        <StatCard
          icon={<Brain className="w-5 h-5 text-violet-600" />}
          label="Emotion Sessions"
          value={data.totalEmotionLogs.toLocaleString()}
          subtitle="AI wellness sessions"
          bgAccent="bg-violet-50"
        />
        <StatCard
          icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
          label="Suspended Accounts"
          value={data.suspendedUsers.toString()}
          subtitle="temporary restrictions"
          bgAccent="bg-amber-50"
        />
        <StatCard
          icon={<Ban className="w-5 h-5 text-red-500" />}
          label="Banned Accounts"
          value={data.bannedUsers.toString()}
          subtitle="permanent restrictions"
          bgAccent="bg-red-50"
        />
      </div>

      {/* ── section B: user registrations + verification donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* monthly user growth chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">User Growth</CardTitle>
            </div>
            <CardDescription>New patients and counselors over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {hasMonthlyUsers ? (
              <ChartContainer config={userRegistrationConfig} className="h-[280px] w-full">
                <BarChart data={monthlyUserData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="patients"
                    fill="var(--color-patients)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="counselors"
                    fill="var(--color-counselors)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="No registration data yet" />
            )}
          </CardContent>
        </Card>

        {/* counselor verification status donut */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Verification Status</CardTitle>
            </div>
            <CardDescription>
              {data.totalCounselors} total counselors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasVerifData ? (
              <ChartContainer
                config={{
                  Pending: { label: "Pending", color: "#FFAB00" },
                  Verified: { label: "Verified", color: "#00796B" },
                  Rejected: { label: "Rejected", color: "#ef4444" },
                }}
                className="h-[280px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={data.counselorVerificationBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {data.counselorVerificationBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="No counselors yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── section C: appointment trends + status donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* monthly appointment outcomes chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Appointment Trends</CardTitle>
            </div>
            <CardDescription>Monthly outcomes across the platform (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {hasMonthlyAppts ? (
              <ChartContainer config={appointmentTrendConfig} className="h-[280px] w-full">
                <BarChart
                  data={monthlyApptData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="completed"
                    fill="var(--color-completed)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="cancelled"
                    fill="var(--color-cancelled)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="missed"
                    fill="var(--color-missed)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="scheduled"
                    fill="var(--color-scheduled)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="No appointment data yet" />
            )}
          </CardContent>
        </Card>

        {/* appointment status donut */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Status Breakdown</CardTitle>
            </div>
            <CardDescription>All-time appointment distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {hasStatusData ? (
              <ChartContainer
                config={{
                  Scheduled: { label: "Scheduled", color: "#00796B" },
                  Completed: { label: "Completed", color: "#10b981" },
                  Cancelled: { label: "Cancelled", color: "#ef4444" },
                  Missed: { label: "Missed", color: "#f59e0b" },
                }}
                className="h-[280px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={data.appointmentStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {data.appointmentStatusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="No appointments yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── section D: top specialties + dominant emotions (horizontal bars) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* top counselor specialties */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Top Specialties</CardTitle>
            </div>
            <CardDescription>Most common counselor specialization areas</CardDescription>
          </CardHeader>
          <CardContent>
            {hasSpecialties ? (
              <ChartContainer config={specialtiesConfig} className="h-[280px] w-full">
                <BarChart
                  data={data.topSpecialties}
                  layout="vertical"
                  margin={{ left: 8, right: 20, top: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e5e7eb"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="No specialty data yet" />
            )}
          </CardContent>
        </Card>

        {/* dominant emotions from emotion logs */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-base">Dominant Emotions</CardTitle>
            </div>
            <CardDescription>Most frequent emotions detected in wellness sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {hasEmotions ? (
              <ChartContainer config={emotionsConfig} className="h-[280px] w-full">
                <BarChart
                  data={data.dominantEmotions}
                  layout="vertical"
                  margin={{ left: 8, right: 20, top: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e5e7eb"
                  />
                  <YAxis
                    type="category"
                    dataKey="emotion"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="No emotion log data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── section E: top counselors table + recent reports ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* top 5 counselors by average rating */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base">Top Counselors</CardTitle>
            </div>
            <CardDescription>Highest rated verified counselors on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {hasTopCounselors ? (
              <div className="space-y-1">
                {data.topCounselors.map((c, i) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-4 p-3.5 rounded-xl hover:bg-gray-50 transition-colors ${
                      i < data.topCounselors.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    {/* rank badge */}
                    <div className="w-8 h-8 rounded-lg bg-primary/8 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      #{i + 1}
                    </div>

                    {/* name + specialty */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.professionalTitle ?? c.primarySpecialty ?? "Counselor"}
                      </p>
                    </div>

                    {/* star rating */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={c.avgRating} />
                        <span className="text-sm font-semibold text-gray-900">
                          {c.avgRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {c.totalAppointments} appt{c.totalAppointments !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <ShieldCheck className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No counselor reviews yet</p>
                <p className="text-xs text-gray-400 mt-1">Top counselors will appear here once reviews are in</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* last 5 reports filed */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base">Recent Reports</CardTitle>
            </div>
            <CardDescription>{data.totalReportsThisWeek} filed this week</CardDescription>
          </CardHeader>
          <CardContent>
            {hasReports ? (
              <div className="space-y-3">
                {data.recentReports.map((r, i) => (
                  <div
                    key={r.id}
                    className={`space-y-1 pb-3 ${i < data.recentReports.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{r.reason}</p>
                    <p className="text-xs text-gray-500">
                      {r.patientName} → {r.counselorName}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {format(new Date(r.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <ShieldCheck className="w-10 h-10 mb-3 text-emerald-300" />
                <p className="text-sm font-medium text-emerald-600">No reports filed</p>
                <p className="text-xs text-gray-400 mt-1">The platform is clean</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── section F: this week snapshot + quick links ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* this week's activity snapshot */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">This Week&apos;s Activity</CardTitle>
            </div>
            <CardDescription>Platform activity since Monday</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50">
              <div className="border-l-[3px] border-primary pl-3 flex-1">
                <p className="text-2xl font-bold text-gray-900">{data.newUsersThisWeek}</p>
                <p className="text-xs text-gray-500">new user registrations</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50">
              <div className="border-l-[3px] border-emerald-500 pl-3 flex-1">
                <p className="text-2xl font-bold text-gray-900">{data.newAppointmentsThisWeek}</p>
                <p className="text-xs text-gray-500">appointments booked</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50">
              <div className="border-l-[3px] border-amber-400 pl-3 flex-1">
                <p className="text-2xl font-bold text-gray-900">{data.totalReportsThisWeek}</p>
                <p className="text-xs text-gray-500">reports filed</p>
              </div>
              {data.totalReportsThisWeek > 0 && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  Needs review
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50">
              <div className="border-l-[3px] border-red-400 pl-3 flex-1">
                <p className="text-2xl font-bold text-gray-900">
                  {data.suspendedUsers + data.bannedUsers}
                </p>
                <p className="text-xs text-gray-500">restricted accounts total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* quick links to other admin pages */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Admin Quick Links</CardTitle>
            </div>
            <CardDescription>Jump to other admin sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* verification queue — active link */}
            <Link
              href="/dashboard/admin/verification"
              className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 hover:bg-primary/5 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Verification Queue</p>
                <p className="text-xs text-gray-500">Review pending counselor applications</p>
              </div>
              {data.pendingVerificationsCount > 0 && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full flex-shrink-0">
                  {data.pendingVerificationsCount}
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>

            {/* user management — active link */}
            <Link
              href="/dashboard/admin/users/counselors"
              className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 hover:bg-primary/5 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors flex-shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">User Management</p>
                <p className="text-xs text-gray-500">Manage counselors and patients</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>

            {/* reports center — coming soon */}
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 opacity-50 cursor-not-allowed pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">Reports Center</p>
                <p className="text-xs text-gray-400">View and manage filed reports</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                Soon
              </span>
            </div>

            {/* platform settings — coming soon */}
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 opacity-50 cursor-not-allowed pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">Platform Settings</p>
                <p className="text-xs text-gray-400">Configure global app settings</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                Soon
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── section G: mini stats row — appointment breakdown ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat
          icon={<CalendarCheck className="w-4 h-4" />}
          label="Completed"
          value={data.completedAppointments}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <MiniStat
          icon={<Calendar className="w-4 h-4" />}
          label="Cancelled"
          value={data.cancelledAppointments}
          color="text-red-500"
          bg="bg-red-50"
        />
        <MiniStat
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Missed"
          value={data.missedAppointments}
          color="text-amber-500"
          bg="bg-amber-50"
        />
        <MiniStat
          icon={<Star className="w-4 h-4" />}
          label="Total Reviews"
          value={data.totalReviews}
          color="text-violet-600"
          bg="bg-violet-50"
        />
      </div>
    </div>
  );
}
