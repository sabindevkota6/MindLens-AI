import { auth } from "@/auth";
import { getEmotionLogById } from "@/lib/actions/history";
import { buildReportPayload } from "@/lib/emotion-report-payload";
import { renderEmotionReportPdfBuffer } from "@/lib/emotion-report-render";

export async function GET(
  _req: Request,
  context: { params: Promise<{ logId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { logId } = await context.params;
  const result = await getEmotionLogById(logId);
  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  const payload = buildReportPayload(result.log);
  if (!payload) {
    return new Response("Report data unavailable", { status: 404 });
  }

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
