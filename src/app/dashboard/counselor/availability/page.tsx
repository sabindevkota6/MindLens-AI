import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getCounselorProfile,
  getRecurringSchedule,
  getAvailabilitySlots,
} from "@/lib/actions/counselor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SetScheduleForm } from "@/components/counselor/set-schedule-form";
import { ManageAvailability } from "@/components/counselor/manage-availability";
import { CalendarDays, Settings } from "lucide-react";

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

  const weekStart = getWeekStart();
  const userId = session.user.id;

  // Run ALL queries in parallel instead of sequentially
  const [profile, schedule, initialSlots] = await Promise.all([
    getCounselorProfile(),
    getRecurringSchedule(userId),
    getAvailabilitySlots(weekStart.toISOString(), userId),
  ]);

  if (!profile?.isOnboarded) redirect("/dashboard/counselor/onboarding");

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
          <p className="text-gray-500 mt-1">
            Manage your schedule and appointment slots
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="w-full h-12 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <TabsTrigger
              value="schedule"
              className="flex-1 h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Set Your Schedule
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="flex-1 h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-6">
            <SetScheduleForm initialSchedule={schedule} />
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <ManageAvailability
              initialSlots={initialSlots}
              initialWeekStart={weekStart.toISOString()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
