"use client";

import { useState } from "react";
import { DocumentUploader } from "@/components/counselor/document-uploader";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";

// dialog wrapper used on the profile page when the counselor wants to re-upload
export function DocumentUploadDialog() {
    const [open, setOpen] = useState(false);

    const handleSuccess = () => {
        setTimeout(() => {
            setOpen(false);
            window.location.reload();
        }, 1200);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                <p className="text-sm text-gray-500 pt-1">
                    Upload a new license or certificate for verification. Accepted formats: PDF, JPG, PNG (Max 5MB).
                </p>
                <DocumentUploader onSuccess={handleSuccess} compact />
            </DialogContent>
        </Dialog>
    );
}
