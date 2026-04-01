import { Flag } from "lucide-react";
import { getAdminReportStats, getAtRiskPatients } from "@/lib/actions/admin-reports";
import { AdminReportsList } from "@/components/admin/admin-reports-list";

export const dynamic = "force-dynamic";

// small stat chip — same pattern as users stats row
function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15 ${accent ?? ""}`}
    >
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs text-white/70 leading-tight">{label}</span>
    </div>
  );
}

export default async function AdminReportsPage() {
  // fetch stats and at-risk list in parallel
  const [statsResult, atRiskResult] = await Promise.all([
    getAdminReportStats(),
    getAtRiskPatients(),
  ]);

  const stats = "error" in statsResult ? null : statsResult;
  const atRiskPatients = "error" in atRiskResult ? [] : atRiskResult;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* hero banner */}
      <section className="pt-16">
        <div className="bg-primary px-6 lg:px-8 py-12 pb-20">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* breadcrumb */}
            <div className="flex items-center gap-2 text-white/70">
              <Flag className="w-4 h-4" />
              <span className="text-sm font-medium">Admin · Reports Center</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Reports Center
            </h1>
            <p className="text-white/75 text-base max-w-2xl">
              Review conduct reports filed by counselors against patients. Monitor risk tiers and navigate to enforcement actions from a patient&apos;s detail page.
            </p>

            {/* stat chips row */}
            {stats && (
              <div className="flex flex-wrap gap-3 pt-2">
                <StatChip label="total reports" value={stats.totalReports} />
                <StatChip label="this week" value={stats.reportsThisWeek} />
                <StatChip label="this month" value={stats.reportsThisMonth} />
                <StatChip
                  label="patients at risk"
                  value={stats.patientsAtRisk}
                  accent="border-amber-300/20"
                />
                <StatChip
                  label="high-risk patients"
                  value={stats.patientsHighRisk}
                  accent="border-red-300/20"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* content — overlaps hero with -mt-10 */}
      <section className="px-6 lg:px-8 -mt-10 pb-16">
        <div className="max-w-7xl mx-auto">
          <AdminReportsList atRiskPatients={atRiskPatients} />
        </div>
      </section>
    </div>
  );
}
