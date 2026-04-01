"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { getAdminDocumentDownloadUrl } from "@/lib/actions/admin-user-management";

interface AdminDocDownloadButtonProps {
  documentId: string;
  label?: string;
}

// generates a short-lived presigned url and opens it — works for any verification status
export function AdminDocDownloadButton({ documentId, label = "View Document" }: AdminDocDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    const result = await getAdminDocumentDownloadUrl(documentId);
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="gap-2 text-teal-700 border-teal-200 hover:bg-teal-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
      {label}
    </Button>
  );
}
