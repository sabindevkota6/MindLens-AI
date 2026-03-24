import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEmotionHistory } from "@/lib/actions/history";
import { getPatientProfile } from "@/lib/actions/patient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  History,
  Brain,
} from "lucide-react";

// color for each emotion — used as the dot indicator on each card
const EMOTION_COLORS: Record<string, string> = {
  Fear: "#818cf8",
  Sadness: "#60a5fa",
  Anger: "#f87171",
  Disgust: "#4ade80",
  Happiness: "#fbbf24",
  Surprise: "#22d3ee",
  Neutral: "#94a3b8",
  "Confusion & Overwhelm": "#c084fc",
};

// format the log date into a human-readable string
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export default async function EmotionHistoryPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const profile = await getPatientProfile();
  const isProfileComplete = profile?.isOnboarded && profile?.dateOfBirth;
  if (!isProfileComplete) redirect("/dashboard/patient/onboarding");

  const logs = await getEmotionHistory();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* teal header */}
      <section className="pt-16">
        <div className="bg-primary px-4 md:px-8 py-14 pb-16">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/dashboard/patient"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="max-w-5xl mx-auto text-center space-y-5">
              <div>
                <span className="inline-block bg-white/15 text-white text-sm font-medium px-5 py-1.5 rounded-full backdrop-blur-sm">
                  Emotion Journey
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                Your Analysis History
              </h1>
              <p className="text-white/80 text-base max-w-xl mx-auto leading-relaxed">
                Every session is a step toward greater self-understanding.
                Review your past analyses and track your emotional journey over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* history grid */}
      <section className="px-4 md:px-8 py-10 pb-16 -mt-6">
        <div className="max-w-7xl mx-auto">
          {logs.length === 0 ? (
            // empty state — shown when the patient hasn't run any analyses yet
            <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-12 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    No analyses yet
                  </h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Run your first Emotion Analysis to begin building your
                    emotional history.
                  </p>
                </div>
                <Link href="/dashboard/patient/emotion-test">
                  <Button className="bg-primary hover:bg-[#00695C] text-white rounded-xl px-8 py-5 text-sm font-semibold shadow-sm">
                    Take Your First Analysis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* count badge */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <History className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {logs.length}{" "}
                  {logs.length === 1 ? "analysis" : "analyses"} recorded
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {logs.map((log, index) => {
                  const emotionColor =
                    EMOTION_COLORS[log.dominantEmotion] || "#94a3b8";

                  return (
                    <Card
                      key={log.id}
                      className="border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 rounded-2xl overflow-hidden bg-white"
                    >
                      {/* colored top strip based on dominant emotion */}
                      <div
                        className="h-1.5"
                        style={{
                          background: `linear-gradient(90deg, ${emotionColor}, ${emotionColor}99)`,
                        }}
                      />

                      <CardContent className="p-6 space-y-4">
                        {/* session number + date */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                              Session #{logs.length - index}
                            </p>
                            <p className="text-sm font-semibold text-slate-700">
                              {formatDate(log.recordedAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                            <Clock className="w-3 h-3" />
                            {formatTime(log.recordedAt)}
                          </div>
                        </div>

                        {/* dominant emotion */}
                        <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3">
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: emotionColor }}
                          />
                          <div>
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
                              Primary State
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                              {log.dominantEmotion}
                            </p>
                          </div>
                        </div>

                        {/* view report button */}
                        <Link
                          href={`/dashboard/patient/history/${log.id}`}
                          className="block"
                        >
                          <Button
                            variant="outline"
                            className="w-full rounded-xl border-gray-200 hover:border-primary/40 hover:text-primary hover:bg-primary/[0.03] text-sm font-medium gap-2 transition-colors"
                          >
                            View Full Report
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
