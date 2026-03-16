"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  Sparkles,
  Fingerprint,
  TrendingUp,
  Heart,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecommendedCounselor } from "@/lib/actions/recommendation";

// shared type for passing analysis data between components
export interface EmotionAnalysisResult {
  dominantEmotion: string;
  emotions: Record<string, number>;
  recommendations: RecommendedCounselor[];
}

// color palette for each emotion bucket — chosen to be calming and distinct
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

// lighter tints used as secondary accents for each emotion
const EMOTION_LIGHT_BG: Record<string, string> = {
  Fear: "#eef2ff",
  Sadness: "#eff6ff",
  Anger: "#fef2f2",
  Disgust: "#f0fdf4",
  Happiness: "#fefce8",
  Surprise: "#ecfeff",
  Neutral: "#f8fafc",
  "Confusion & Overwhelm": "#faf5ff",
};

// empathetic messages tailored to each dominant emotion
const EMOTION_MESSAGES: Record<string, { headline: string; subtext: string }> = {
  Fear: {
    headline: "Your analysis suggests a heightened state of alertness.",
    subtext:
      "Fear is your body's natural protection system. Recognizing it is a powerful step toward understanding yourself better.",
  },
  Sadness: {
    headline: "Your analysis reflects a quiet, introspective emotional state.",
    subtext:
      "Sadness is a deeply human experience. Acknowledging it shows real emotional awareness and inner strength.",
  },
  Anger: {
    headline: "Your analysis indicates strong emotional intensity.",
    subtext:
      "Anger often signals that something important to you needs attention. Understanding its roots can bring clarity.",
  },
  Disgust: {
    headline: "Your analysis shows a strong reactive response.",
    subtext:
      "This emotion often relates to personal boundaries. Understanding what triggers it can help you navigate situations more clearly.",
  },
  Happiness: {
    headline: "Your analysis radiates a positive emotional state.",
    subtext:
      "This is wonderful to see. Understanding what brings you joy can help you sustain it in your daily life.",
  },
  Surprise: {
    headline: "Your analysis captures a state of heightened awareness.",
    subtext:
      "Surprise reflects your mind actively processing something unexpected. It's a sign of deep engagement with your world.",
  },
  Neutral: {
    headline: "Your analysis shows a calm, balanced emotional state.",
    subtext:
      "A neutral state reflects composure. It can also mean your deeper feelings need a bit more exploration to surface.",
  },
  "Confusion & Overwhelm": {
    headline: "Your analysis suggests a complex emotional landscape.",
    subtext:
      "Feeling overwhelmed is completely natural. It often means you're processing many things at once — and that's okay.",
  },
};

// derives a consistent color set from a counselor's name for the avatar
const AVATAR_COLORS = [
  { bg: "bg-blue-100", ring: "ring-blue-200", text: "text-blue-600" },
  { bg: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-600" },
  { bg: "bg-slate-100", ring: "ring-slate-200", text: "text-slate-600" },
  { bg: "bg-violet-100", ring: "ring-violet-200", text: "text-violet-600" },
  { bg: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-600" },
  { bg: "bg-cyan-100", ring: "ring-cyan-200", text: "text-cyan-600" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface EmotionResultsProps {
  dominantEmotion: string;
  emotions: Record<string, number>;
  recommendations: RecommendedCounselor[];
}

export function EmotionResultsDashboard({
  dominantEmotion,
  emotions,
  recommendations,
}: EmotionResultsProps) {
  // controls whether progress bars have animated to their target width
  const [animated, setAnimated] = useState(false);

  // trigger bar animation shortly after mount for a staggered reveal
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // multiply raw 0-1 scores by 100 so the radar shape fills the chart area
  const radarData = useMemo(() => {
    return Object.entries(emotions).map(([name, value]) => ({
      emotion: name === "Confusion & Overwhelm" ? "Confusion" : name,
      fullName: name,
      value: Math.round(value * 100),
    }));
  }, [emotions]);

  // find the peak value so the radius axis scales to the actual data range
  const peakValue = useMemo(() => {
    const max = Math.max(...radarData.map((d) => d.value));
    return Math.ceil(max / 10) * 10 || 10;
  }, [radarData]);

  // pick the 3 strongest emotions for the bar breakdown
  const top3 = useMemo(() => {
    return Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, value]) => ({
        name,
        percentage: Math.round(value * 100),
        color: EMOTION_COLORS[name] || "#00796B",
        lightBg: EMOTION_LIGHT_BG[name] || "#f0faf8",
      }));
  }, [emotions]);

  // normalize bar widths so the top emotion nearly fills the track
  const maxPercentage = top3[0]?.percentage || 1;

  const dominantColor = EMOTION_COLORS[dominantEmotion] || "#00796B";
  const message = EMOTION_MESSAGES[dominantEmotion] || {
    headline: `Your primary emotional state appears to be ${dominantEmotion}.`,
    subtext:
      "Understanding your emotions is a powerful step toward greater self-awareness.",
  };

  // shadcn chart config for the radar chart
  const chartConfig = {
    value: { label: "Intensity", color: "#00796B" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* section 1 — empathetic summary with decorative background */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#e0f2ef] via-[#f5faf9] to-[#e8f0fa] border border-[#b3d9cf] p-8 md:p-10 text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/[0.08] rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/[0.06] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4" />
            Analysis Complete
          </span>

          <h2 className="text-2xl md:text-[1.75rem] font-bold text-slate-900 leading-snug max-w-2xl mx-auto">
            {message.headline}
          </h2>

          {/* dominant emotion indicator pill */}
          <div className="inline-flex items-center gap-2.5 bg-white border border-gray-200 rounded-full px-5 py-2.5 shadow-sm">
            <div
              className="w-3 h-3 rounded-full ring-4 ring-offset-1"
              style={{ backgroundColor: dominantColor }}
            />
            <span className="text-sm font-semibold text-slate-700">
              {dominantEmotion}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              primary signal
            </span>
          </div>

          <p className="text-slate-500 text-[15px] max-w-xl mx-auto leading-relaxed">
            {message.subtext}
          </p>
        </div>
      </div>

      {/* self-awareness disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          <span className="font-semibold">Self-Awareness Only.</span> This is
          not a clinical diagnosis. Results reflect AI interpretation of
          expressed emotions during your recording.
        </p>
      </div>

      {/* section 2 — visualization grid (asymmetric 3:2 for visual interest) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* radar chart — emotional fingerprint */}
        <Card className="lg:col-span-3 border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6 md:p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Fingerprint className="w-[18px] h-[18px] text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-[15px]">
                  Emotional Fingerprint
                </h3>
                <p className="text-xs text-slate-400">
                  Your unique emotional signature
                </p>
              </div>
            </div>

            <ChartContainer
              config={chartConfig}
              className="mx-auto w-full"
              style={{ height: "380px" }}
            >
              {/* large outerRadius with enough margin to keep labels uncropped */}
              <RadarChart
                data={radarData}
                cx="50%"
                cy="50%"
                outerRadius="85%"
                margin={{ top: 35, right: 55, bottom: 35, left: 55 }}
              >
                <PolarGrid
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeOpacity={0.9}
                />
                <PolarAngleAxis
                  dataKey="emotion"
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                  tickLine={false}
                />
                {/* domain scales to actual data so the shape fills the chart */}
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, peakValue]}
                  tick={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 shadow-lg">
                        <p className="text-sm font-semibold text-slate-700">
                          {data.fullName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {data.value}% intensity
                        </p>
                      </div>
                    );
                  }}
                />
                <Radar
                  name="Intensity"
                  dataKey="value"
                  stroke="#00796B"
                  strokeWidth={2}
                  fill="#00796B"
                  fillOpacity={0.4}
                  dot={false}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* top 3 emotion breakdown with animated bars */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6 md:p-7 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-[18px] h-[18px] text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-[15px]">
                  Strongest Signals
                </h3>
                <p className="text-xs text-slate-400">
                  Top 3 emotions detected
                </p>
              </div>
            </div>

            <div className="space-y-5 flex-1 flex flex-col justify-center">
              {top3.map((emotion, i) => {
                // scale bar width relative to the top emotion
                const barWidth =
                  (emotion.percentage / maxPercentage) * 92;
                return (
                  <div key={emotion.name} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* rank badge */}
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: emotion.lightBg,
                            color: emotion.color,
                          }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {emotion.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {emotion.percentage}%
                      </span>
                    </div>

                    {/* animated progress bar */}
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all ease-out"
                        style={{
                          width: animated ? `${barWidth}%` : "0%",
                          backgroundColor: emotion.color,
                          boxShadow: animated
                            ? `0 0 14px ${emotion.color}30`
                            : "none",
                          transitionDuration: "1200ms",
                          transitionDelay: `${i * 200 + 300}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* all 8 emotions in a compact grid below the bars */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-slate-400 font-medium mb-3">
                All emotions
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {Object.entries(emotions)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, value]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              EMOTION_COLORS[name] || "#94a3b8",
                          }}
                        />
                        <span className="text-xs text-slate-500 truncate">
                          {name === "Confusion & Overwhelm"
                            ? "Confusion"
                            : name}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-600 tabular-nums">
                        {Math.round(value * 100)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* section 3 — recommended counselors matched by cosine similarity */}
      <div className="space-y-5">
        {/* section header with descriptive text */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Heart className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-[15px]">
                Recommended For You
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-xl">
                Based on your results, we recommend speaking with specialists
                who understand{" "}
                <span className="font-medium text-slate-700">
                  {dominantEmotion.toLowerCase()}
                </span>
                . These counselors are matched to your emotional profile.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/patient"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1 whitespace-nowrap flex-shrink-0"
          >
            Browse all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <Card className="border border-gray-200 rounded-2xl bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-slate-500">
                No counselors matched yet. Please check back after more
                specialists join.
              </p>
              <Link href="/dashboard/patient" className="mt-4 inline-block">
                <Button className="bg-primary hover:bg-[#00695C] text-white rounded-xl mt-4 text-sm">
                  Browse Counselors
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((counselor) => {
              const avatarColor = getAvatarColor(counselor.fullName);
              const initials = getInitials(counselor.fullName);
              const visibleTags = counselor.specialties.slice(0, 3);
              const overflowCount = counselor.specialties.length - 3;

              return (
                <Card
                  key={counselor.id}
                  className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group rounded-2xl py-0"
                >
                  <CardContent className="p-0">
                    {/* avatar section — teal-50 background matching dashboard */}
                    <div className="relative flex flex-col items-center pt-8 pb-5 bg-teal-50">
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary text-white text-xs font-medium px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </div>
                      <div
                        className={cn(
                          "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ring-4",
                          avatarColor.bg,
                          avatarColor.ring,
                          avatarColor.text
                        )}
                      >
                        {initials}
                      </div>
                    </div>

                    {/* name and title */}
                    <div className="px-6 pt-5 pb-2 space-y-0.5">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {counselor.fullName}
                      </h3>
                      {counselor.professionalTitle && (
                        <p className="text-sm text-gray-500">
                          {counselor.professionalTitle}
                        </p>
                      )}
                    </div>

                    {/* specialty badges */}
                    {visibleTags.length > 0 && (
                      <div className="px-6 pb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {visibleTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-primary/8 text-primary border border-primary/15 text-xs font-normal px-3 py-0.5 rounded-full"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {overflowCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-500 border-0 text-xs font-normal px-3 py-0.5 rounded-full"
                            >
                              +{overflowCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mx-6 border-t border-gray-100" />

                    {/* experience */}
                    <div className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{counselor.experienceYears} years experience</span>
                      </div>
                    </div>

                    <div className="mx-6 border-t border-gray-100" />

                    {/* rate */}
                    <div className="px-6 py-4">
                      <p className="text-sm font-medium text-primary">
                        Rs. {counselor.hourlyRate} / session
                      </p>
                    </div>

                    {/* book session button */}
                    <div className="px-6 pb-6">
                      <Link href={`/dashboard/patient/counselor/${counselor.id}`}>
                        <Button className="w-full h-11 rounded-xl font-semibold text-sm bg-primary hover:bg-[#00695C] text-white">
                          Book Session
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
