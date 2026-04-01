"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AdminUserStats } from "@/lib/actions/admin-user-management";

interface AdminUsersStatsRowProps {
  stats: AdminUserStats;
  activeTab: "counselors" | "patients";
}

// small stat chip for the header band
function StatChip({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={cn("flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15", accent)}>
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs text-white/70 leading-tight">{label}</span>
    </div>
  );
}

export function AdminUsersStatsRow({ stats, activeTab }: AdminUsersStatsRowProps) {
  return (
    <div className="space-y-4 pt-2">
      {/* tab switcher */}
      <div className="flex gap-2">
        <Link
          href="/dashboard/admin/users/counselors"
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
            activeTab === "counselors"
              ? "bg-white text-primary shadow-sm"
              : "text-white/80 hover:text-white hover:bg-white/10"
          )}
        >
          Counselors
        </Link>
        <Link
          href="/dashboard/admin/users/patients"
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
            activeTab === "patients"
              ? "bg-white text-primary shadow-sm"
              : "text-white/80 hover:text-white hover:bg-white/10"
          )}
        >
          Patients
        </Link>
      </div>

      {/* stat chips */}
      <div className="flex flex-wrap gap-3">
        {activeTab === "counselors" ? (
          <>
            <StatChip label="total counselors" value={stats.totalCounselors} />
            <StatChip label="active & verified" value={stats.activeCounselors} />
            <StatChip label="pending verification" value={stats.pendingVerifications} />
          </>
        ) : (
          <>
            <StatChip label="total patients" value={stats.totalPatients} />
            <StatChip label="reports this week" value={stats.totalReportsThisWeek} />
          </>
        )}
        <StatChip label="suspended accounts" value={stats.suspendedUsers} accent="border-amber-300/20" />
        <StatChip label="banned accounts" value={stats.bannedUsers} accent="border-red-300/20" />
      </div>
    </div>
  );
}
