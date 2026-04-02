import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/lib/actions/admin-stats";
import { AdminStatsCharts } from "@/components/admin/admin-stats-charts";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, AlertTriangle } from "lucide-react";

// always fetch fresh data on every request — no stale cache
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();

  // belt-and-suspenders auth check on top of middleware
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* hero banner — same structure as verification/page.tsx */}
      <section className="pt-16">
        <div className="bg-primary px-4 sm:px-6 lg:px-8 py-10 sm:py-14 pb-24 sm:pb-28">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* breadcrumb */}
            <div className="flex items-center gap-2 text-white/70">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Admin · Dashboard</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
              Platform Analytics
            </h1>

            <p className="text-white/75 text-base max-w-2xl leading-relaxed">
              A real-time overview of users, appointments, revenue, and wellness activity across MindLens AI.
            </p>

            {/* quick-glance pills shown in the hero if data loaded ok */}
            {"error" in stats ? null : (
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
                  <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
                  <span className="text-xs text-white/70 leading-tight">total users</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
                  <span className="text-2xl font-bold text-white">{stats.totalAppointments}</span>
                  <span className="text-xs text-white/70 leading-tight">total appointments</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
                  <span className="text-2xl font-bold text-white">{stats.activeCounselors}</span>
                  <span className="text-xs text-white/70 leading-tight">active counselors</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* main content — overlaps hero bottom with negative margin */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-14 pb-16">
        <div className="max-w-7xl mx-auto">
          {"error" in stats ? (
            // error state card
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <p className="text-base font-medium text-gray-700">Unable to load analytics</p>
                <p className="text-sm text-gray-400">Please refresh the page or try again later.</p>
              </CardContent>
            </Card>
          ) : (
            <AdminStatsCharts data={stats} />
          )}
        </div>
      </section>
    </div>
  );
}
