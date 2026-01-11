"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CounselorProfileSchema } from "@/lib/schemas";
import { updateCounselorProfile } from "@/lib/actions/counselor";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Briefcase, DollarSign, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";

type ProfileFormValues = z.infer<typeof CounselorProfileSchema>;

interface ProfileFormProps {
    initialData: {
        bio?: string | null;
        experienceYears?: number;
        hourlyRate?: number | string;
    } | null;
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(CounselorProfileSchema) as any,
        defaultValues: {
            bio: initialData?.bio || "",
            experienceYears: initialData?.experienceYears || 0,
            hourlyRate: Number(initialData?.hourlyRate) || 0,
        },
    });

    const onSubmit = (values: ProfileFormValues) => {
        setMessage(null);
        startTransition(() => {
            updateCounselorProfile(values).then((data) => {
                if (data.error) {
                    setMessage({ type: "error", text: data.error });
                }
                if (data.success) {
                    setMessage({ type: "success", text: data.success });
                }
            });
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* experience and rate row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="experienceYears"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-brand-teal" />
                                    Years of Experience
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        className="h-11 border-gray-200 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                    How many years have you been practicing?
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    Hourly Rate (USD)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        className="h-11 border-gray-200 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                    Your consultation rate per hour
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* bio field */}
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Professional Bio
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell patients about your expertise, qualifications, and approach to mental health care..."
                                    className="min-h-[150px] border-gray-200 rounded-xl resize-none focus:border-brand-teal focus:ring-brand-teal"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                                This will be displayed on your public profile. Minimum 10 characters.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* message display */}
                {message && (
                    <div className={`flex items-center gap-2 p-4 rounded-xl ${message.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                        {message.type === "success" ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <XCircle className="w-5 h-5" />
                        )}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* submit button */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-brand-teal hover:bg-teal-700 text-white px-8 h-11 rounded-xl font-medium transition-all"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Update Profile"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
