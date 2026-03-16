import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getEmotionLogById } from "@/lib/actions/history";
import { getRecommendedCounselors } from "@/lib/actions/recommendation";
import { EmotionResultsDashboard } from "@/components/mer/emotion-results";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ logId: string }>;
}

export default async function EmotionLogDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const { logId } = await params;

  // fetch the log and verify ownership in one call
  const result = await getEmotionLogById(logId);
  if (!result) notFound();

  const { log, profileId } = result;

  // extract the aggregated emotion scores from the stored json
  const json = log.humeAnalysisJson as { aggregated?: Record<string, number> };
  const emotions = json.aggregated;

  if (!emotions) notFound();

  // generate fresh recommendations based on this patient's latest log
  const recommendations = await getRecommendedCounselors(profileId, 3);

  // format the date for the page header
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(log.recordedAt));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* teal header */}
      <section className="pt-16">
        <div className="bg-primary px-4 md:px-8 py-14 pb-16">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/dashboard/patient/history"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to History
            </Link>

            <div className="max-w-5xl mx-auto text-center space-y-4">
              <div>
                <span className="inline-block bg-white/15 text-white text-sm font-medium px-5 py-1.5 rounded-full backdrop-blur-sm">
                  Emotion Analysis Report
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                {formattedDate}
              </h1>
              <p className="text-white/70 text-sm">
                Primary emotional state:{" "}
                <span className="text-white font-semibold">
                  {log.dominantEmotion}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* disclaimer */}
      <section className="px-4 md:px-8 -mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#eef8f5] border border-[#bfe6dc] rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#2c5c55] leading-relaxed">
              <span className="font-semibold">Medical Disclaimer:</span> This
              report is for self-awareness only and does not constitute a
              medical diagnosis. If you are in crisis, please contact emergency
              services immediately.
            </p>
          </div>
        </div>
      </section>

      {/* full emotion results dashboard pre-filled with historical data */}
      <section className="px-4 md:px-8 py-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <EmotionResultsDashboard
            dominantEmotion={log.dominantEmotion}
            emotions={emotions}
            recommendations={recommendations}
          />
        </div>
      </section>
    </div>
  );
}
