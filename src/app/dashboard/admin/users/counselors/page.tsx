import { Suspense } from "react";
import { getAdminUserStats, searchAdminCounselors } from "@/lib/actions/admin-user-management";
import { AdminUsersStatsRow } from "@/components/admin/admin-users-stats-row";
import { AdminCounselorsList } from "@/components/admin/admin-counselors-list";
import { Users, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    verification?: string;
    account?: string;
    specialty?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AdminCounselorsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [stats, counselorsResult] = await Promise.all([
    getAdminUserStats(),
    searchAdminCounselors({
      query: params.q,
      verificationStatus: (params.verification as "PENDING" | "VERIFIED" | "REJECTED" | "all") || "all",
      accountStatus: (params.account as "active" | "suspended" | "banned" | "all") || "all",
      specialtyId: params.specialty ? Number(params.specialty) : undefined,
      sortBy: (params.sort as "registeredAt" | "popularity" | "rating" | "experience") || "registeredAt",
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
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Counselors</h1>
            <p className="text-white/75 text-base max-w-2xl">
              Search, filter, and manage all counselor accounts. Verify, suspend, or ban users from their detail pages.
            </p>

            {"error" in stats ? null : (
              <Suspense fallback={null}>
                <AdminUsersStatsRow stats={stats} activeTab="counselors" />
              </Suspense>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-8 -mt-10 pb-16">
        <div className="max-w-7xl mx-auto">
          {"error" in counselorsResult ? (
            <div className="bg-white rounded-2xl p-8 text-center text-red-500 shadow-sm">
              {counselorsResult.error}
            </div>
          ) : (
            <AdminCounselorsList
              initialData={counselorsResult}
              initialParams={{
                query: params.q || "",
                verificationStatus: params.verification || "all",
                accountStatus: params.account || "all",
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
