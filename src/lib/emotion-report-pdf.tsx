import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Polygon,
  Line,
  Circle,
} from "@react-pdf/renderer";
import type { EmotionReportPayload } from "@/lib/emotion-report-payload";
import { PRIMARY_HEX } from "@/lib/emotion-report-constants";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 48,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
  },
  header: {
    backgroundColor: PRIMARY_HEX,
    marginHorizontal: -40,
    marginTop: -36,
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 40,
    marginBottom: 14,
  },
  headerBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "#ffffff",
    fontSize: 9,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 8,
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 9,
    textAlign: "center",
  },
  headerDominant: {
    color: "#ffffff",
    fontWeight: 700,
  },
  medBox: {
    backgroundColor: "#eef8f5",
    borderWidth: 1,
    borderColor: "#bfe6dc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  medText: {
    fontSize: 8.5,
    color: "#2c5c55",
    lineHeight: 1.45,
  },
  medBold: { fontWeight: 700 },
  summaryCard: {
    backgroundColor: "#f0faf8",
    borderWidth: 1,
    borderColor: "#b3d9cf",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  analysisBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(0,121,107,0.12)",
    color: PRIMARY_HEX,
    fontSize: 8,
    fontWeight: 700,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  headline: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 10,
    lineHeight: 1.35,
  },
  pillRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  pillText: { fontSize: 8.5, fontWeight: 700, color: "#334155" },
  pillMuted: { fontSize: 7.5, color: "#94a3b8", marginLeft: 6 },
  subtextWrap: { maxWidth: 420, alignSelf: "center" },
  subtext: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.45,
  },
  amberBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  amberText: { fontSize: 8.5, color: "#92400e", lineHeight: 1.4 },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: "#0f172a", marginBottom: 4 },
  sectionHint: { fontSize: 7.5, color: "#94a3b8", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 10 },
  colFingerprint: { flex: 3 },
  colSignals: { flex: 2 },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#ffffff",
  },
  barTrack: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    marginTop: 4,
  },
  barFill: { height: 8, borderRadius: 4 },
  rankBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  rankNum: { fontSize: 8, fontWeight: 700 },
  emotionRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  emotionItem: { marginBottom: 10 },
  emotionName: { flex: 1, fontSize: 8.5, fontWeight: 600, color: "#334155" },
  emotionPct: { fontSize: 8.5, fontWeight: 700, color: "#1e293b" },
  allEmoTitle: { fontSize: 7.5, color: "#94a3b8", marginTop: 8, marginBottom: 4 },
  grid2: { flexDirection: "row", flexWrap: "wrap" },
  gridCell: { width: "50%", paddingRight: 4, marginBottom: 3 },
  gridCellRow: { flexDirection: "row", alignItems: "center" },
  gridCellLabel: { flex: 1, fontSize: 7.5, color: "#64748b" },
  gridCellPct: { fontSize: 7.5, fontWeight: 600, color: "#475569", marginLeft: 6 },
  dot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  radarChartWrap: { alignItems: "center", marginBottom: 4 },
  radarSvgLabel: { fontSize: 6.8, fontFamily: "Helvetica" },
  footer: { marginTop: 16, fontSize: 7.5, color: "#94a3b8", textAlign: "center" },
});

/** same spoke angles as buildReportPayload polygon (deg): (360*i)/n - 90 */
function labelAnchorForAngleDeg(deg: number): "start" | "middle" | "end" {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  if (Math.abs(c) < 0.35 && Math.abs(s) > 0.5) return "middle";
  return c >= 0 ? "start" : "end";
}

function RadarChartPdf({
  polygonPoints,
  labels,
}: {
  polygonPoints: string;
  labels: { label: string; angle: number }[];
}) {
  const cx = 100;
  const cy = 100;
  const rings = [26, 52, 78];
  const labelR = 94;

  return (
    <View style={styles.radarChartWrap}>
      <Svg width={240} height={240} viewBox="-40 -40 280 280">
        {rings.map((r) => (
          <Circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            stroke="#cbd5e1"
            strokeWidth={0.75}
            fill="none"
            strokeDasharray="3 3"
          />
        ))}
        {labels.map(({ angle }, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = cx + 78 * Math.cos(rad);
          const y1 = cy - 78 * Math.sin(rad);
          return (
            <Line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={x1}
              y2={y1}
              stroke="#e2e8f0"
              strokeWidth={0.5}
            />
          );
        })}
        <Polygon
          points={polygonPoints}
          fill={PRIMARY_HEX}
          fillOpacity={0.35}
          stroke={PRIMARY_HEX}
          strokeWidth={1.5}
        />
        {labels.map(({ label, angle }, i) => {
          const rad = (angle * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          let lx = cx + labelR * cos;
          let ly = cy - labelR * sin;
          const anchor = labelAnchorForAngleDeg(angle);
          const pad = 5;
          if (anchor === "start") lx += pad;
          if (anchor === "end") lx -= pad;
          ly += 2;
          return (
            <Text
              key={`lab-${i}-${label}`}
              x={lx}
              y={ly}
              textAnchor={anchor}
              style={styles.radarSvgLabel}
              fill="#64748b"
            >
              {label}
            </Text>
          );
        })}
      </Svg>
    </View>
  );
}

export function EmotionReportPdfDocument({ data }: { data: EmotionReportPayload }) {
  const n = data.radarData.length;
  const labelAngles = data.radarData.map((_, i) => {
    const deg = (360 * i) / n - 90;
    return { label: data.radarData[i].label, angle: deg };
  });

  return (
    <Document
      title="MindLens AI Emotion Analysis Report"
      author="MindLens AI"
      subject="Emotion analysis"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerBadge}>Emotion Analysis Report</Text>
          <Text style={styles.headerTitle}>{data.headerDateFormatted}</Text>
          <Text style={styles.headerSub}>
            Primary emotional state: <Text style={styles.headerDominant}>{data.dominantEmotion}</Text>
          </Text>
        </View>

        <View style={styles.medBox}>
          <Text style={styles.medText}>
            <Text style={styles.medBold}>Medical Disclaimer:</Text> This report is for self-awareness only and
            does not constitute a medical diagnosis. If you are in crisis, please contact emergency services
            immediately.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.analysisBadge}>Analysis Complete</Text>
          <Text style={styles.headline}>{data.headline}</Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <View style={[styles.pillDot, { backgroundColor: data.dominantColorHex }]} />
              <Text style={styles.pillText}>{data.dominantEmotion}</Text>
              <Text style={styles.pillMuted}>primary signal</Text>
            </View>
          </View>
          <View style={styles.subtextWrap}>
            <Text style={styles.subtext}>{data.subtext}</Text>
          </View>
        </View>

        <View style={styles.amberBox}>
          <Text style={styles.amberText}>
            <Text style={styles.medBold}>Self-Awareness Only.</Text> This is not a clinical diagnosis. Results
            reflect AI interpretation of expressed emotions during your recording.
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.colFingerprint}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Emotional Fingerprint</Text>
              <Text style={styles.sectionHint}>Your unique emotional signature</Text>
              <RadarChartPdf polygonPoints={data.radarPolygonPoints} labels={labelAngles} />
            </View>
          </View>
          <View style={styles.colSignals}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Strongest Signals</Text>
              <Text style={styles.sectionHint}>Top 3 emotions detected</Text>
              {data.top3.map((emotion, i) => {
                const barWidth = (emotion.percentage / data.maxBarPercent) * 100;
                return (
                  <View key={emotion.name} style={styles.emotionItem}>
                    <View style={styles.emotionRow}>
                      <View style={[styles.rankBox, { backgroundColor: emotion.lightBg }]}>
                        <Text style={[styles.rankNum, { color: emotion.color }]}>{i + 1}</Text>
                      </View>
                      <Text style={styles.emotionName}>{emotion.name}</Text>
                      <Text style={styles.emotionPct}>{emotion.percentage}%</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: emotion.color }]} />
                    </View>
                  </View>
                );
              })}
              <Text style={styles.allEmoTitle}>All emotions</Text>
              <View style={styles.grid2}>
                {data.allEmotionsSorted.map((e) => (
                  <View key={e.name} style={styles.gridCell}>
                    <View style={styles.gridCellRow}>
                      <View style={[styles.dot, { backgroundColor: e.color }]} />
                      <Text style={styles.gridCellLabel}>{e.displayName}</Text>
                      <Text style={styles.gridCellPct}>{e.percentage}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Generated by MindLens AI — confidential patient report</Text>
      </Page>
    </Document>
  );
}
