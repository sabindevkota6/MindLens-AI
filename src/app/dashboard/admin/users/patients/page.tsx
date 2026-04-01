import { Suspense } from "react";
import { getAdminUserStats, searchAdminPatients } from "@/lib/actions/admin-user-management";
import { AdminUsersStatsRow } from "@/components/admin/admin-users-stats-row";
import { AdminPatientsList } from "@/components/admin/admin-patients-list";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    account?: string;
    reported?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AdminPatientsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [stats, patientsResult] = await Promise.all([
    getAdminUserStats(),
    searchAdminPatients({
      query: params.q,
      accountStatus: (params.account as "active" | "suspended" | "banned" | "all") || "all",
      reportedStatus: (params.reported as "reported" | "unreported" | "all") || "all",
      sortBy: (params.sort as "registeredAt" | "activeness" | "mostReported") || "registeredAt",
      page: params.page ? Number(params.page) : 1,
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-16">
        <div className="bg-primary px-6 lg:px-8 py-12 pb-20">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-white/70">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Admin · User Management</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Patients</h1>
            <p className="text-white/75 text-base max-w-2xl">
              Search, filter, and manage all patient accounts. View reports, analytics, and take enforcement actions.
            </p>

            {"error" in stats ? null : (
              <Suspense fallback={null}>
                <AdminUsersStatsRow stats={stats} activeTab="patients" />
              </Suspense>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-8 -mt-10 pb-16">
        <div className="max-w-7xl mx-auto">
          {"error" in patientsResult ? (
            <div className="bg-white rounded-2xl p-8 text-center text-red-500 shadow-sm">
              {patientsResult.error}
            </div>
          ) : (
            <AdminPatientsList
              initialData={patientsResult}
              initialParams={{
                query: params.q || "",
                accountStatus: params.account || "all",
                reportedStatus: params.reported || "all",
                sortBy: params.sort || "registeredAt",
                page: params.page ? Number(params.page) : 1,
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
