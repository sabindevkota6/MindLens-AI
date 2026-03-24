import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile } from "@/lib/actions/counselor";
import { getCounselorDashboardStats } from "@/lib/actions/dashboard";
import { CounselorDashboardCharts } from "@/components/counselor/dashboard-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCog, LayoutDashboard, User, Clock, AlertTriangle, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function CounselorDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getCounselorProfile();
  const isProfileComplete =
    profile?.isOnboarded &&
    profile?.professionalTitle &&
    profile?.bio &&
    profile?.experienceYears != null &&
    profile?.hourlyRate != null &&
    profile?.dateOfBirth;
  if (!isProfileComplete) redirect("/dashboard/counselor/onboarding");

  const verificationStatus = profile?.verificationStatus;
  const isVerified = verificationStatus === "VERIFIED";

  // only load stats if the counselor is verified
  const stats = isVerified ? await getCounselorDashboardStats() : null;
  const firstName = session.user.name?.split(" ")[0] || "Counselor";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* hero banner */}
      <section className="pt-16">
        <div className="bg-primary px-6 lg:px-8 py-16 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-white/70" />
                  <span className="text-sm text-white/70 font-medium">Dashboard</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Welcome back, {firstName}
                </h1>
                <p className="text-white/75 text-base max-w-lg">
                  {isVerified
                    ? "Here's an overview of your practice performance and upcoming schedule."
                    : "Complete your verification to start accepting patient appointments."}
                </p>
              </div>
              <div className="flex items-center gap-3">
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

      {/* main dashboard content */}
      <section className="px-6 lg:px-8 -mt-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* pending verification banner */}
          {verificationStatus === "PENDING" && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              <Clock className="h-4 w-4 !text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold">Account Under Review</AlertTitle>
              <AlertDescription className="text-amber-700">
                Your account is currently under review by administrators. You will be visible in the marketplace once approved. This usually takes 1–2 business days.
              </AlertDescription>
            </Alert>
          )}

          {/* rejected verification banner */}
          {verificationStatus === "REJECTED" && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <AlertTriangle className="h-4 w-4 !text-red-600" />
              <AlertTitle className="text-red-800 font-semibold">Verification Rejected</AlertTitle>
              <AlertDescription className="text-red-700 space-y-2">
                <p>Your verification documents were rejected. Please re-upload a valid professional license or certificate.</p>
                <Link href="/dashboard/counselor/profile">
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Re-upload Document
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* show charts only when verified */}
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
            // placeholder card while awaiting verification
            <Card className="border-0 shadow-sm">
              <CardContent className="py-20 text-center space-y-3">
                <div className="flex justify-center mb-2">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <CalendarCog className="w-7 h-7 text-gray-400" />
                  </div>
                </div>
                <p className="text-gray-600 font-medium">Scheduling features are unavailable</p>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  Your appointment scheduling tools will unlock once your account is verified by an administrator.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* bottom cta — only shown to verified counselors */}
      {isVerified && (
        <section className="px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-gradient-to-br from-[#00796B] to-[#009688]">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="p-10 lg:p-14 flex flex-col justify-center space-y-5">
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
                  {/* illustration */}
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
