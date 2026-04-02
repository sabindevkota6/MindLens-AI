import { Settings } from "lucide-react";
import { getPlatformSettings, getSpecialtiesWithCounts } from "@/lib/actions/admin-settings";
import { AdminSettingsPanel } from "@/components/admin/admin-settings-panel";

export const dynamic = "force-dynamic";

// small stat chip — same pattern as other admin pages
function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
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

export default async function AdminSettingsPage() {
  // fetch settings and specialties in parallel
  const [settingsResult, specialtiesResult] = await Promise.all([
    getPlatformSettings(),
    getSpecialtiesWithCounts(),
  ]);

  const settings = "error" in settingsResult ? null : settingsResult;
  const specialties = "error" in specialtiesResult ? [] : specialtiesResult;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* hero banner */}
      <section className="pt-16">
        <div className="bg-primary px-4 sm:px-6 lg:px-8 py-12 pb-20">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* breadcrumb */}
            <div className="flex items-center gap-2 text-white/70">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Admin · Platform Settings</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Platform Settings
            </h1>
            <p className="text-white/75 text-base max-w-2xl">
              Configure enforcement thresholds, manage counselor specialty types, and review the complete admin audit trail.
            </p>

            {/* stat chips row */}
            <div className="flex flex-wrap gap-3 pt-2">
              <StatChip label="specialty types" value={specialties.length} />
              <StatChip
                label="day auto-suspend"
                value={settings?.autoSuspendDays ?? 5}
                accent="border-amber-300/20"
              />
              <StatChip
                label="reports to auto-ban"
                value={settings?.autoBanAt ?? 20}
                accent="border-red-300/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* content — overlaps hero with -mt-10 */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="max-w-7xl mx-auto">
          <AdminSettingsPanel
            initialSettings={settings}
            initialSpecialties={specialties}
          />
        </div>
      </section>
    </div>
  );
}
