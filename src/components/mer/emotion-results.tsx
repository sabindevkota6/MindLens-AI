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

// shared type for passing analysis data between components
export interface EmotionAnalysisResult {
  dominantEmotion: string;
  emotions: Record<string, number>;
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

interface EmotionResultsProps {
  dominantEmotion: string;
  emotions: Record<string, number>;
}

export function EmotionResultsDashboard({
  dominantEmotion,
  emotions,
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
              style={{
                backgroundColor: dominantColor,
                ringColor: `${dominantColor}20`,
              }}
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

      {/* section 3 — recommendation / next step */}
      <Card className="border border-[#c5e0d8] shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-[#edf7f4] via-[#f6fbf9] to-[#eef5f2]">
        <CardContent className="p-7 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Recommended For You
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Based on your emotional profile, speaking with a specialist
                who understands{" "}
                <span className="font-medium text-slate-700">
                  {dominantEmotion.toLowerCase()}
                </span>{" "}
                could provide valuable support and clarity.
              </p>
            </div>
            <Link href="/dashboard/patient">
              <Button className="bg-primary hover:bg-[#00695C] text-white rounded-xl px-6 py-5 text-sm font-semibold gap-2 shadow-sm whitespace-nowrap">
                Browse Counselors
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
