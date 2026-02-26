"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CounselorProfileSchema } from "@/lib/schemas";
import { updateCounselorProfile } from "@/lib/actions/counselor";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Loader2,
    CheckCircle2,
    User,
    Briefcase,
    Star,
    Mail,
    Phone,
    Calendar,
    Wallet,
    FileText,
} from "lucide-react";

type ProfileFormValues = z.infer<typeof CounselorProfileSchema>;

interface EditProfileFormProps {
    initialData: any;
    specialties: { id: number; name: string }[];
    email: string;
}

export default function EditProfileForm({ initialData, specialties, email }: EditProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const initialSpecialtyIds = initialData?.specialties?.map((s: any) => s.specialtyId) || [];

    const formatDateForInput = (date: Date | string | null | undefined) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toISOString().split("T")[0];
    };

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(CounselorProfileSchema) as any,
        defaultValues: {
            fullName: initialData?.fullName || "",
            professionalTitle: initialData?.professionalTitle || "",
            bio: initialData?.bio || "",
            experienceYears: initialData?.experienceYears || 0,
            hourlyRate: Number(initialData?.hourlyRate) || 0,
            dateOfBirth: formatDateForInput(initialData?.dateOfBirth) || "",
            phoneNumber: initialData?.user?.phoneNumber || "",
            specialties: initialSpecialtyIds,
        },
    });

    const onSubmit = (values: ProfileFormValues) => {
        setError(null);
        setSuccess(null);

        startTransition(async () => {
            const res = await updateCounselorProfile(values);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccess(res.success || "Profile updated!");
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    };

    return (
        <div className="space-y-6">
            {/* Status Alerts */}
            {success && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* ─── Personal Information Card ─── */}
                    <Card className="shadow-sm border border-gray-100">
                        <CardContent className="p-8">
                            <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <User className="w-3.5 h-3.5" />
                                                Full Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Dr. Sita Sharma" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Email (read-only) */}
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <Mail className="w-3.5 h-3.5" />
                                        Email
                                    </FormLabel>
                                    <Input
                                        value={email}
                                        disabled
                                        className="bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <FormDescription className="text-xs">Email cannot be changed.</FormDescription>
                                </FormItem>

                                {/* Date of Birth */}
                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Date of Birth
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Phone Number */}
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <Phone className="w-3.5 h-3.5" />
                                                Phone Number
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="98XXXXXXXX" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ─── Professional Details Card ─── */}
                    <Card className="shadow-sm border border-gray-100">
                        <CardContent className="p-8">
                            <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                Professional Details
                            </h2>

                            {/* Professional Title */}
                            <div className="mb-6">
                                <FormField
                                    control={form.control}
                                    name="professionalTitle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                Professional Title
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Clinical Psychologist, Licensed Therapist" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                {/* Experience */}
                                <FormField
                                    control={form.control}
                                    name="experienceYears"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                Experience (Years)
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Hourly Rate */}
                                <FormField
                                    control={form.control}
                                    name="hourlyRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <Wallet className="w-3.5 h-3.5" />
                                                Hourly Rate (NPR)
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" min={1} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Bio */}
                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <FileText className="w-3.5 h-3.5" />
                                            Professional Bio
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Share your background, approach, and areas of expertise..."
                                                className="min-h-[140px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* ─── Specialties Card ─── */}
                    <Card className="shadow-sm border border-gray-100">
                        <CardContent className="p-8">
                            <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                                <Star className="w-5 h-5" />
                                Specialties & Expertise
                            </h2>

                            {/* Existing Tags */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                {specialties.length > 0 ? specialties.map((item) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="specialties"
                                        render={({ field }) => {
                                            const isSelected = !!field.value?.includes(item.id);
                                            return (
                                                <FormItem key={item.id}>
                                                    <FormControl>
                                                        <label
                                                            className={`
                                                                relative flex items-center justify-center px-4 py-2 rounded-full border-2 transition-all cursor-pointer select-none text-sm font-medium
                                                                ${isSelected
                                                                    ? "bg-primary border-primary text-white shadow-md transform scale-105"
                                                                    : "bg-white border-gray-200 text-gray-600 hover:border-primary/50 hover:bg-primary/5"}
                                                            `}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    if (checked) {
                                                                        field.onChange([...(field.value || []), item.id]);
                                                                    } else {
                                                                        field.onChange(field.value?.filter((val) => val !== item.id));
                                                                    }
                                                                }}
                                                            />
                                                            {item.name}
                                                        </label>
                                                    </FormControl>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                )) : (
                                    <div className="w-full p-4 border border-dashed rounded-xl text-center">
                                        <p className="text-xs text-gray-400">Loading system categories...</p>
                                    </div>
                                )}

                                {/* Custom Tags Display */}
                                {form.watch("customSpecialties")?.map((name, index) => (
                                    <Badge
                                        key={`custom-${index}`}
                                        className="bg-primary border-primary text-white shadow-md transform scale-105 px-4 py-2 rounded-full border-2 text-sm font-medium cursor-default"
                                    >
                                        {name}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = form.getValues("customSpecialties") || [];
                                                form.setValue("customSpecialties", current.filter(n => n !== name));
                                            }}
                                            className="ml-2 hover:text-red-200"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>

                            {/* Custom Tag Input */}
                            <div className="flex gap-2">
                                <Input
                                    id="custom-specialty-input"
                                    placeholder="Add a custom specialty..."
                                    className="max-w-[280px]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const input = e.currentTarget;
                                            const val = input.value.trim();
                                            if (val) {
                                                const current = form.getValues("customSpecialties") || [];
                                                if (!current.includes(val)) {
                                                    form.setValue("customSpecialties", [...current, val]);
                                                }
                                                input.value = "";
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                                    onClick={() => {
                                        const input = document.getElementById("custom-specialty-input") as HTMLInputElement;
                                        const val = input.value.trim();
                                        if (val) {
                                            const current = form.getValues("customSpecialties") || [];
                                            if (!current.includes(val)) {
                                                form.setValue("customSpecialties", [...current, val]);
                                            }
                                            input.value = "";
                                        }
                                    }}
                                >
                                    Add
                                </Button>
                            </div>

                            <p className="text-xs text-gray-400 mt-3">
                                Don&apos;t see your specialty? Type it above and press Enter or &quot;Add&quot;.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg shadow-lg rounded-xl transition-colors"
                    >
                        {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Save Profile Changes
                    </Button>
                </form>
            </Form>
        </div>
    );
}
