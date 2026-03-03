"use client";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Area, AreaChart } from "recharts";
import { Calendar, DollarSign, Star, Users, TrendingUp, Clock, CalendarCheck, CalendarX, CircleAlert, MessageSquare } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type DashboardData = {
  counselorName: string;
  hourlyRate: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  missedAppointments: number;
  scheduledAppointments: number;
  totalEarnings: number;
  uniquePatients: number;
  avgRating: number;
  totalReviews: number;
  ratingDistribution: { stars: string; count: number }[];
  monthlyTrends: { month: string; completed: number; cancelled: number; missed: number }[];
  upcomingAppointments: { id: string; patientName: string; startTime: Date; endTime: Date }[];
  todayAppointments: { id: string; patientName: string; startTime: Date; endTime: Date }[];
  recentReviews: { id: string; rating: number; comment: string | null; patientName: string; date: Date }[];
};

// chart color configs
const monthlyTrendConfig = {
  completed: { label: "Completed", color: "#00796B" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  missed: { label: "Missed", color: "#f59e0b" },
} satisfies ChartConfig;

const statusPieConfig = {
  scheduled: { label: "Scheduled", color: "#00796B" },
  completed: { label: "Completed", color: "#10b981" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  missed: { label: "Missed", color: "#f59e0b" },
} satisfies ChartConfig;

const ratingConfig = {
  count: { label: "Reviews", color: "#00796B" },
} satisfies ChartConfig;

// reusable star renderer
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

// format month label from "2025-01" to "Jan"
function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return format(date, "MMM");
}

export function CounselorDashboardCharts({ data }: { data: DashboardData }) {
  // pie chart data for appointment status breakdown
  const statusPieData = [
    { name: "Scheduled", value: data.scheduledAppointments, fill: "#00796B" },
    { name: "Completed", value: data.completedAppointments, fill: "#10b981" },
    { name: "Cancelled", value: data.cancelledAppointments, fill: "#ef4444" },
    { name: "Missed", value: data.missedAppointments, fill: "#f59e0b" },
  ].filter((d) => d.value > 0);

  // formatted monthly trends
  const monthlyData = data.monthlyTrends.map((t) => ({
    ...t,
    label: formatMonth(t.month),
  }));

  const hasChartData = monthlyData.length > 0;
  const hasStatusData = statusPieData.length > 0;
  const hasRatingData = data.ratingDistribution.some((r) => r.count > 0);

  return (
    <div className="space-y-8">
      {/* stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-primary" />}
          label="Total Appointments"
          value={data.totalAppointments.toString()}
          subtitle={`${data.scheduledAppointments} upcoming`}
          bgAccent="bg-primary/8"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          label="Total Earnings"
          value={`$${data.totalEarnings.toLocaleString()}`}
          subtitle={`$${data.hourlyRate}/hr rate`}
          bgAccent="bg-emerald-50"
        />
        <StatCard
          icon={<Star className="w-5 h-5 text-amber-500" />}
          label="Average Rating"
          value={data.avgRating > 0 ? data.avgRating.toFixed(1) : "N/A"}
          subtitle={`${data.totalReviews} review${data.totalReviews !== 1 ? "s" : ""}`}
          bgAccent="bg-amber-50"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-violet-600" />}
          label="Unique Patients"
          value={data.uniquePatients.toString()}
          subtitle="patients served"
          bgAccent="bg-violet-50"
        />
      </div>

      {/* charts row - monthly trends + status pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* monthly appointment trends - area chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Monthly Trends</CardTitle>
            </div>
            <CardDescription>Appointment outcomes over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {hasChartData ? (
              <ChartContainer config={monthlyTrendConfig} className="h-[280px] w-full">
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00796B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00796B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="completed" stroke="#00796B" strokeWidth={2} fill="url(#fillCompleted)" />
                  <Area type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="missed" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="No appointment data yet" />
            )}
          </CardContent>
        </Card>

        {/* appointment status pie chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Status Breakdown</CardTitle>
            </div>
            <CardDescription>Appointment outcomes distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {hasStatusData ? (
              <ChartContainer config={statusPieConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} strokeWidth={2} stroke="#fff">
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
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

      {/* second row - rating distribution + today's schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* rating distribution bar chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base">Rating Distribution</CardTitle>
            </div>
            <CardDescription>{data.totalReviews} total reviews</CardDescription>
          </CardHeader>
          <CardContent>
            {hasRatingData ? (
              <ChartContainer config={ratingConfig} className="h-[240px] w-full">
                <BarChart data={data.ratingDistribution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="stars" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#00796B" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartState message="No reviews yet" />
            )}
          </CardContent>
        </Card>

        {/* today's schedule */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
            </div>
            <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {data.todayAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/dashboard/counselor/appointments/${apt.id}`}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{apt.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(apt.startTime), "h:mm a")} – {format(new Date(apt.endTime), "h:mm a")}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                      {isAppointmentNow(apt.startTime, apt.endTime) ? "In Progress" : "Upcoming"}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <CalendarX className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No appointments today</p>
                <p className="text-xs text-gray-400 mt-1">Your schedule is clear</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* third row - upcoming appointments + recent reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* upcoming appointments */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Upcoming Appointments</CardTitle>
              </div>
              <Link href="/dashboard/counselor/appointments" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/dashboard/counselor/appointments/${apt.id}`}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{apt.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(apt.startTime), "EEE, MMM d · h:mm a")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Calendar className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No upcoming appointments</p>
                <p className="text-xs text-gray-400 mt-1">New bookings will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* recent reviews */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Recent Reviews</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentReviews.length > 0 ? (
              <div className="space-y-4">
                {data.recentReviews.map((review) => (
                  <div key={review.id} className="p-3.5 rounded-xl bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{review.patientName}</p>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{review.comment}</p>
                    )}
                    <p className="text-[11px] text-gray-400">{format(new Date(review.date), "MMM d, yyyy")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Star className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No reviews yet</p>
                <p className="text-xs text-gray-400 mt-1">Patient reviews will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* performance summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat icon={<CalendarCheck className="w-4 h-4" />} label="Completed" value={data.completedAppointments} color="text-emerald-600" bg="bg-emerald-50" />
        <MiniStat icon={<CalendarX className="w-4 h-4" />} label="Cancelled" value={data.cancelledAppointments} color="text-red-500" bg="bg-red-50" />
        <MiniStat icon={<CircleAlert className="w-4 h-4" />} label="Missed" value={data.missedAppointments} color="text-amber-500" bg="bg-amber-50" />
        <MiniStat icon={<Calendar className="w-4 h-4" />} label="Scheduled" value={data.scheduledAppointments} color="text-primary" bg="bg-primary/8" />
      </div>
    </div>
  );
}

// stat card component
function StatCard({ icon, label, value, subtitle, bgAccent }: {
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
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl ${bgAccent} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// mini stat badge
function MiniStat({ icon, label, value, color, bg }: {
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

// empty state for charts with no data
function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
      <TrendingUp className="w-10 h-10 mb-3 text-gray-300" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs mt-1">Data will appear as you get appointments</p>
    </div>
  );
}

// check if an appointment is currently in progress
function isAppointmentNow(startTime: Date, endTime: Date) {
  const now = new Date();
  return now >= new Date(startTime) && now <= new Date(endTime);
}
