import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getCounselorProfile,
  getRecurringSchedule,
  getAvailabilitySlots,
  getSlotStats,
} from "@/lib/actions/counselor";
import {
  counselorHasVerificationDocuments,
  isCounselorProfileComplete,
  isCounselorVerified,
} from "@/lib/counselor-guards";
import {
  CounselorSchedulingLockedCard,
  CounselorVerificationAlerts,
} from "@/components/counselor/verification-scheduling-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SetScheduleForm } from "@/components/counselor/set-schedule-form";
import { ManageAvailability } from "@/components/counselor/manage-availability";
import { CalendarDays, Settings } from "lucide-react";

/** Matches globals secondary (light green) + secondary-foreground (brand teal text) — distinct from hero bg-primary */
const availabilityTabTriggerClass =
  "flex !h-auto min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200/90 bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-md shadow-black/[0.07] transition-all after:hidden hover:bg-gray-50/90 hover:shadow-md data-[state=active]:border-primary/25 data-[state=active]:!bg-secondary data-[state=active]:!text-secondary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-black/[0.08] [&_svg]:text-gray-500 data-[state=active]:[&_svg]:text-secondary-foreground";

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default async function AvailabilityPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COUNSELOR") redirect("/login");

  const profile = await getCounselorProfile();
  if (!profile || !isCounselorProfileComplete(profile)) {
    redirect("/dashboard/counselor/onboarding");
  }

  const verificationStatus = profile.verificationStatus;
  const isVerified = isCounselorVerified(profile);
  const hasVerificationDoc = counselorHasVerificationDocuments(profile);

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Availability
                </h1>
                <p className="text-white/70 text-sm mt-0.5">
                  Manage your schedule and appointment slots
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-4 pb-12 space-y-6">
          <CounselorVerificationAlerts
            verificationStatus={verificationStatus}
            hasVerificationDoc={hasVerificationDoc}
          />
          <CounselorSchedulingLockedCard />
        </div>
      </div>
    );
  }

  const weekStart = getWeekStart();
  const userId = session.user.id;

  const [schedule, initialSlots, slotStats] = await Promise.all([
    getRecurringSchedule(userId),
    getAvailabilitySlots(weekStart.toISOString(), userId),
    getSlotStats(userId),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Availability
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                Manage your schedule and appointment slots
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-4 pb-12">
        <Tabs defaultValue="schedule" className="w-full">
          <div className="sticky top-16 z-40 mb-2 overflow-hidden rounded-xl border border-gray-200/70 bg-gray-50/95 px-2.5 py-2.5 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)] backdrop-blur-sm supports-[backdrop-filter]:bg-gray-50/85">
            <TabsList className="grid w-full grid-cols-2 items-center gap-3 !h-auto !min-h-0 p-0 bg-transparent border-0 shadow-none">
              <TabsTrigger value="schedule" className={availabilityTabTriggerClass}>
                <CalendarDays className="w-4 h-4 shrink-0" />
                Set Your Schedule
              </TabsTrigger>
              <TabsTrigger value="manage" className={availabilityTabTriggerClass}>
                <Settings className="w-4 h-4 shrink-0" />
                Manage Availability
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="schedule" className="mt-6">
            <SetScheduleForm initialSchedule={schedule} />
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <ManageAvailability
              initialSlots={initialSlots}
              initialWeekStart={weekStart.toISOString()}
              stats={slotStats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
