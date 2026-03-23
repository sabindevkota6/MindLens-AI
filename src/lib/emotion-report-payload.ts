import type { EmotionLog } from "@prisma/client";
import {
  EMOTION_COLORS,
  EMOTION_LIGHT_BG,
  EMOTION_MESSAGES,
  PRIMARY_HEX,
} from "@/lib/emotion-report-constants";

/** normalized shape used by the history UI, PDF export, and download API */
export interface EmotionReportPayload {
  logId: string;
  recordedAt: Date;
  headerDateFormatted: string;
  dominantEmotion: string;
  headline: string;
  subtext: string;
  dominantColorHex: string;
  emotions: Record<string, number>;
  radarData: { label: string; fullName: string; valuePercent: number }[];
  peakValue: number;
  /** space-separated "x,y" pairs for Svg Polygon (viewBox 0 0 200 200) */
  radarPolygonPoints: string;
  top3: {
    name: string;
    percentage: number;
    color: string;
    lightBg: string;
  }[];
  maxBarPercent: number;
  allEmotionsSorted: {
    name: string;
    displayName: string;
    percentage: number;
    color: string;
  }[];
}

/**
 * Single contract from DB log → report. Returns null if aggregated scores are missing.
 */
export function buildReportPayload(
  log: Pick<EmotionLog, "id" | "recordedAt" | "dominantEmotion" | "humeAnalysisJson">,
): EmotionReportPayload | null {
  const raw = log.humeAnalysisJson as { aggregated?: Record<string, number> };
  const emotions = raw?.aggregated;
  if (!emotions || typeof emotions !== "object") return null;

  const dominantRaw = log.dominantEmotion?.trim();
  const dominantEmotion =
    dominantRaw && dominantRaw.length > 0 ? dominantRaw : "Unknown";

  const msg = EMOTION_MESSAGES[dominantEmotion] ?? {
    headline: `Your primary emotional state appears to be ${dominantEmotion}.`,
    subtext:
      "Understanding your emotions is a powerful step toward greater self-awareness.",
  };

  const dominantColorHex = EMOTION_COLORS[dominantEmotion] || PRIMARY_HEX;

  const radarData = Object.entries(emotions).map(([name, value]) => ({
    label: name === "Confusion & Overwhelm" ? "Confusion" : name,
    fullName: name,
    valuePercent: Math.round(Number(value) * 100),
  }));

  const maxVal = Math.max(0, ...radarData.map((d) => d.valuePercent));
  const peakValue = Math.max(10, Math.ceil(maxVal / 10) * 10);

  const n = radarData.length;
  const cx = 100;
  const cy = 100;
  const maxR = 78;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const r = (radarData[i].valuePercent / peakValue) * maxR;
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  const radarPolygonPoints = pts.join(" ");

  const top3 = Object.entries(emotions)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 3)
    .map(([name, value]) => ({
      name,
      percentage: Math.round(Number(value) * 100),
      color: EMOTION_COLORS[name] || PRIMARY_HEX,
      lightBg: EMOTION_LIGHT_BG[name] || "#f0faf8",
    }));

  const maxBarPercent = top3[0]?.percentage || 1;

  const allEmotionsSorted = Object.entries(emotions)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([name, value]) => ({
      name,
      displayName: name === "Confusion & Overwhelm" ? "Confusion" : name,
      percentage: Math.round(Number(value) * 100),
      color: EMOTION_COLORS[name] || "#94a3b8",
    }));

  const headerDateFormatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(log.recordedAt));

  return {
    logId: log.id,
    recordedAt: log.recordedAt,
    headerDateFormatted,
    dominantEmotion,
    headline: msg.headline,
    subtext: msg.subtext,
    dominantColorHex,
    emotions,
    radarData,
    peakValue,
    radarPolygonPoints,
    top3,
    maxBarPercent,
    allEmotionsSorted,
  };
}
