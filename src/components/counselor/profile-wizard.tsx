"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CounselorOnboardingSchema } from "@/lib/schemas";
import { completeCounselorProfile, uploadVerificationDoc } from "@/lib/actions/counselor";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Briefcase, DollarSign, FileText, Phone, Upload, Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type WizardValues = z.infer<typeof CounselorOnboardingSchema>;

export default function ProfileWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const form = useForm<WizardValues>({
        resolver: zodResolver(CounselorOnboardingSchema) as any,
        defaultValues: {
            bio: "",
            experienceYears: 0,
            hourlyRate: 0,
            phoneNumber: "",
        },
        mode: "onChange", // validate on change to enable/disable 'Next'
    });

    const handleNext = async () => {
        // Validate step 1 fields
        const valid = await form.trigger(["bio", "experienceYears", "hourlyRate"]);
        if (valid) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setUploadError(null);
        }
    };

    const onSubmit = (values: WizardValues) => {
        startTransition(async () => {
            // 1. Upload file if exists
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const uploadRes = await uploadVerificationDoc(formData);
                if (uploadRes.error) {
                    setUploadError("Document upload failed: " + uploadRes.error);
                    return; // stop execution
                }
                setUploadSuccess(uploadRes.success || "Document uploaded.");
            } else {
                // Ideally enforce file upload if "verificationStatus" logic demands it
            }

            // 2. Complete Profile
            const res = await completeCounselorProfile(values);
            if (res.error) {
                setUploadError(res.error);
            } else {
                // Success - Reload page (server action revalidates path)
                setUploadSuccess("Profile completed! Dashboard ready.");
                router.refresh();
            }
        });
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-lg [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="mx-auto bg-teal-50 p-3 rounded-full mb-2">
                        <Briefcase className="w-8 h-8 text-brand-teal" />
                    </div>
                    <DialogTitle className="text-center text-xl">Complete Your Profile</DialogTitle>
                    <DialogDescription className="text-center">
                        To get started as a counselor, we need a few more details to set up your professional profile.
                    </DialogDescription>
                </DialogHeader>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center gap-2 mt-2 mb-4">
                    <Badge variant={step === 1 ? "default" : "secondary"} className={`rounded-full w-8 h-8 flex items-center justify-center p-0 ${step === 1 ? "bg-brand-teal" : step > 1 ? "bg-green-500 text-white" : ""}`}>
                        {step > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
                    </Badge>
                    <div className={`h-1 w-10 rounded-full ${step > 1 ? "bg-green-500" : "bg-gray-200"}`} />
                    <Badge variant={step === 2 ? "default" : "secondary"} className={`rounded-full w-8 h-8 flex items-center justify-center p-0 ${step === 2 ? "bg-brand-teal" : ""}`}>
                        2
                    </Badge>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* STEP 1: Basic Info */}
                        <div className={step === 1 ? "block space-y-4" : "hidden"}>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="experienceYears"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Experience (Years)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} {...field} className="focus:border-brand-teal focus:ring-brand-teal" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="hourlyRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hourly Rate ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={1} {...field} className="focus:border-brand-teal focus:ring-brand-teal" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Professional Bio</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us about your expertise and approach..."
                                                className="min-h-[120px] resize-none focus:border-brand-teal focus:ring-brand-teal"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>Min. 10 characters</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="button" onClick={handleNext} className="w-full bg-brand-teal hover:bg-teal-700">
                                Next Step <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>

                        {/* STEP 2: Verification */}
                        <div className={step === 2 ? "block space-y-4" : "hidden"}>
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number <span className="text-gray-400 font-normal">(Optional)</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input placeholder="9840111111" className="pl-9 focus:border-brand-teal focus:ring-brand-teal" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <FormLabel>Verification Document</FormLabel>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-gray-400" />
                                        <p className="text-sm font-medium text-gray-700">
                                            {selectedFile ? selectedFile.name : "Click to upload credentials"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PDF, JPG, or PNG (Max 5MB)
                                        </p>
                                    </div>
                                </div>
                                {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
                                {uploadSuccess && <p className="text-sm text-green-500">{uploadSuccess}</p>}
                            </div>

                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                                <Button type="submit" disabled={isPending} className="flex-1 bg-brand-teal hover:bg-teal-700 text-white">
                                    {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Completing...</> : "Complete Setup"}
                                </Button>
                            </div>
                        </div>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
