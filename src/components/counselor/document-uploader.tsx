"use client";

import { useState, useRef } from "react";
import { getVerificationUploadUrl, submitVerificationRecord } from "@/lib/actions/s3-verification";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploaderProps {
    // optional callback so parent steps can react to upload completion
    onSuccess?: () => void;
    // controls whether to show the big card frame or just the uploader zone
    compact?: boolean;
}

export function DocumentUploader({ onSuccess, compact = false }: DocumentUploaderProps) {
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileObj, setFileObj] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_SIZE_MB = 5;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // check size before accepting
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
            return;
        }

        setFileName(file.name);
        setFileObj(file);
        setError(null);
        setSuccess(null);
    };

    const handleUpload = async () => {
        if (!fileObj) {
            setError("Please select a file first.");
            return;
        }

        setError(null);
        setSuccess(null);
        setIsUploading(true);

        try {
            // step 1: get a presigned url from the server
            const urlRes = await getVerificationUploadUrl(fileObj.type);
            if (urlRes.error || !urlRes.signedUrl || !urlRes.fileKey) {
                setError(urlRes.error || "Could not get upload URL.");
                setIsUploading(false);
                return;
            }

            // step 2: put the file directly to s3 using the presigned url
            const uploadRes = await fetch(urlRes.signedUrl, {
                method: "PUT",
                body: fileObj,
                headers: { "Content-Type": fileObj.type },
            });

            if (!uploadRes.ok) {
                setError("Upload to storage failed. Please try again.");
                setIsUploading(false);
                return;
            }

            // step 3: tell the server to save the record and update the status
            const saveRes = await submitVerificationRecord(urlRes.fileKey);
            if (saveRes.error) {
                setError(saveRes.error);
                setIsUploading(false);
                return;
            }

            setSuccess(saveRes.success || "Document submitted successfully!");
            setFileName(null);
            setFileObj(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            if (onSuccess) {
                setTimeout(onSuccess, 1200);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {success && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle2 className="h-4 w-4 !text-green-600" />
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* drop zone */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5",
                    fileName ? "border-primary/40 bg-primary/5" : "border-gray-200",
                    compact ? "p-5" : "p-8"
                )}
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
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <FileText className="w-7 h-7" />
                        <span className="text-sm font-medium">{fileName}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className={cn("text-gray-400", compact ? "w-6 h-6" : "w-8 h-8")} />
                        <p className="text-sm font-medium text-gray-600">Click to select a file</p>
                        <p className="text-xs text-gray-400">PDF, JPG, or PNG (Max 5MB)</p>
                    </div>
                )}
            </div>

            <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !fileObj}
                className="w-full bg-primary hover:bg-primary/90 text-white transition-colors"
            >
                {isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading document...
                    </>
                ) : (
                    "Upload Document"
                )}
            </Button>
        </div>
    );
}
