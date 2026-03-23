import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { EmotionReportPayload } from "@/lib/emotion-report-payload";
import { EmotionReportPdfDocument } from "@/lib/emotion-report-pdf";

export async function renderEmotionReportPdfBuffer(
  data: EmotionReportPayload,
): Promise<Buffer> {
  const doc = React.createElement(EmotionReportPdfDocument, { data });
  return renderToBuffer(
    doc as Parameters<typeof renderToBuffer>[0],
  );
}
