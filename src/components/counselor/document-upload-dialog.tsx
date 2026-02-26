"use client";

import { useState, useTransition, useRef } from "react";
import { uploadVerificationDoc } from "@/lib/actions/counselor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Loader2, CheckCircle2, RefreshCw } from "lucide-react";

export function DocumentUploadDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const res = await uploadVerificationDoc(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.success || "Document uploaded successfully!");
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => {
          setOpen(false);
          setSuccess(null);
          window.location.reload();
        }, 1500);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setError(null); setSuccess(null); setFileName(null); } }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Change Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">Upload Verification Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500">
            Upload a new license or certificate for verification. Accepted formats: PDF, JPG, PNG.
          </p>

          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">Click to select a file</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={isPending || !fileName}
            className="w-full bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
