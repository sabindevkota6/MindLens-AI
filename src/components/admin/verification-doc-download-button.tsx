"use client";

import { useState } from "react";
import { getAdminVerificationDocumentDownloadUrl } from "@/lib/actions/admin-verification";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

// opens presigned url in new tab for view or download
export function VerificationDocDownloadButton({
  documentId,
  label = "Open file",
}: {
  documentId: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function openFile() {
    setLoading(true);
    const res = await getAdminVerificationDocumentDownloadUrl(documentId);
    setLoading(false);
    if ("url" in res) {
      window.open(res.url, "_blank", "noopener,noreferrer");
    } else {
      alert(res.error);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 rounded-xl border-gray-200 bg-white hover:bg-gray-50"
      onClick={openFile}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {label}
    </Button>
  );
}
