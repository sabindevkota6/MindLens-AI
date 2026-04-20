import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildReportPayload } from "@/lib/emotion-report-payload";
import { renderEmotionReportPdfBuffer } from "@/lib/emotion-report-render";

export async function GET(
  _req: Request,
  context: { params: Promise<{ logId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COUNSELOR") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { logId } = await context.params;

  // verify this emotion log is attached to an appointment assigned to this counselor
  const counselorProfile = await prisma.counselorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!counselorProfile) return new Response("Unauthorized", { status: 401 });

  const appointment = await prisma.appointment.findFirst({
    where: {
      counselorProfileId: counselorProfile.id,
      attachedEmotionLogId: logId,
    },
    select: { id: true },
  });
  if (!appointment) return new Response("Not found", { status: 404 });

  const emotionLog = await prisma.emotionLog.findUnique({ where: { id: logId } });
  if (!emotionLog) return new Response("Not found", { status: 404 });

  const payload = buildReportPayload(emotionLog);
  if (!payload) return new Response("Report data unavailable", { status: 404 });

  const buffer = await renderEmotionReportPdfBuffer(payload);
  const safeName = `mindlens-emotion-report-${logId.slice(0, 8)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
