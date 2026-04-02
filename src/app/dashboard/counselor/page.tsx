import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile } from "@/lib/actions/counselor";
import { getCounselorDashboardStats } from "@/lib/actions/dashboard";
import { CounselorDashboardCharts } from "@/components/counselor/dashboard-charts";
import {
  CounselorSchedulingLockedCard,
  CounselorVerificationAlerts,
} from "@/components/counselor/verification-scheduling-gate";
import {
  counselorHasVerificationDocuments,
  isCounselorProfileComplete,
  isCounselorVerified,
} from "@/lib/counselor-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCog, LayoutDashboard, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function CounselorDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getCounselorProfile();
  if (!profile || !isCounselorProfileComplete(profile)) {
    redirect("/dashboard/counselor/onboarding");
  }

  const verificationStatus = profile.verificationStatus;
  const isVerified = isCounselorVerified(profile);
  const hasVerificationDoc = counselorHasVerificationDocuments(profile);

  const stats = isVerified ? await getCounselorDashboardStats() : null;
  const firstName = session.user.name?.split(" ")[0] || "Counselor";

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-16">
        <div className="bg-primary px-4 sm:px-6 lg:px-8 py-12 sm:py-16 pb-20 sm:pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-white/70" />
                  <span className="text-sm text-white/70 font-medium">Dashboard</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Welcome back, {firstName}
                </h1>
                <p className="text-white/75 text-sm sm:text-base max-w-lg">
                  {isVerified
                    ? "Here's an overview of your practice performance and upcoming schedule."
                    : "Complete your verification to start accepting patient appointments."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isVerified && (
                  <Link href="/dashboard/counselor/availability">
                    <Button className="bg-white/15 hover:bg-white/25 text-white border-0 rounded-xl px-5 py-5 text-sm font-semibold gap-2 backdrop-blur-sm">
                      <CalendarCog className="w-4 h-4" />
                      Manage Availability
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/counselor/profile">
                  <Button className="bg-white hover:bg-gray-50 text-primary border-0 rounded-xl px-5 py-5 text-sm font-semibold gap-2 shadow-lg shadow-black/10">
                    <User className="w-4 h-4" />
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={cn(
          "px-4 sm:px-6 lg:px-8 -mt-8",
          !isVerified && "pb-12"
        )}
      >
        <div
          className={cn(
            "mx-auto space-y-6",
            isVerified ? "max-w-7xl" : "max-w-4xl"
          )}
        >
          <CounselorVerificationAlerts
            verificationStatus={verificationStatus}
            hasVerificationDoc={hasVerificationDoc}
            pendingReviewCopy="detailed"
          />

          {isVerified ? (
            stats ? (
              <CounselorDashboardCharts data={stats} />
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center text-gray-400">
                  <p className="text-sm">Unable to load dashboard data. Please try again later.</p>
                </CardContent>
              </Card>
            )
          ) : (
            <CounselorSchedulingLockedCard />
          )}
        </div>
      </section>

      {isVerified && (
        <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="max-w-7xl mx-auto">
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-gradient-to-br from-[#00796B] to-[#009688]">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-center space-y-5">
                    <div>
                      <span className="inline-block bg-white/15 text-white text-sm font-medium px-5 py-2 rounded-full backdrop-blur-sm">
                        Grow Your Practice
                      </span>
                    </div>
                    <h2 className="text-3xl lg:text-[2.5rem] font-bold text-white leading-tight">
                      Optimize Your Availability for More Bookings
                    </h2>
                    <p className="text-white/75 text-base leading-relaxed max-w-lg">
                      Set up your recurring schedule and let patients book sessions directly. Keep your calendar updated to maximize your practice reach and help more people.
                    </p>
                    <div className="pt-2">
                      <Link href="/dashboard/counselor/availability">
                        <Button className="bg-white hover:bg-gray-50 text-primary border-0 rounded-xl px-8 py-6 text-base font-semibold gap-2.5 shadow-lg shadow-black/10">
                          <CalendarCog className="w-5 h-5" />
                          Set Up Schedule
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="relative hidden lg:flex items-center justify-center p-8">
                    <Image
                      src="/counselor-schedule-illustration.png"
                      alt="Counselor managing schedule and availability"
                      width={500}
                      height={400}
                      className="object-contain"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
