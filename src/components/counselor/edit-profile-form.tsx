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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";

type ProfileFormValues = z.infer<typeof CounselorProfileSchema>;

interface EditProfileFormProps {
    initialData: any;
    specialties: { id: number; name: string }[];
}

export default function EditProfileForm({ initialData, specialties }: EditProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const initialSpecialtyIds = initialData?.specialties?.map((s: any) => s.specialtyId) || [];

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(CounselorProfileSchema) as any,
        defaultValues: {
            fullName: initialData?.fullName || "",
            bio: initialData?.bio || "",
            experienceYears: initialData?.experienceYears || 0,
            hourlyRate: Number(initialData?.hourlyRate) || 0,
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
        });
    };

    return (
        <Card className="shadow-lg border-t-4 border-t-brand-teal">
            <CardHeader>
                <CardTitle className="text-xl text-brand-dark">Edit Profile</CardTitle>
                <CardDescription>Update your public professional details.</CardDescription>
            </CardHeader>
            <CardContent>
                {success && (
                    <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Dr. Jane Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="experienceYears"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Experience (Years)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={0} {...field} />
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
                                            <Input type="number" min={1} {...field} />
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
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Share your background and approach..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel className="text-base font-bold text-gray-800">Specialties & Areas of Expertise</FormLabel>

                            {/* Existing Tags */}
                            <div className="flex flex-wrap gap-3 p-1 mb-4">
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
                                                                    ? "bg-brand-teal border-brand-teal text-white shadow-md transform scale-105"
                                                                    : "bg-white border-gray-200 text-gray-600 hover:border-brand-teal/50 hover:bg-teal-50/30"}
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
                                    <div
                                        key={`custom-${index}`}
                                        className="bg-brand-teal border-brand-teal text-white shadow-md transform scale-105 relative flex items-center justify-center px-4 py-2 rounded-full border-2 text-sm font-medium"
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
                                    </div>
                                ))}
                            </div>

                            {/* Custom Tag Input */}
                            <div className="flex gap-2">
                                <Input
                                    id="custom-specialty-input"
                                    placeholder="Add a custom specialty..."
                                    className="max-w-[240px]"
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

                            <FormDescription>Don't see your specialty? Type it above and press Enter or "Add".</FormDescription>
                            <FormMessage />
                        </FormItem>

                        <Button type="submit" disabled={isPending} className="w-full bg-brand-teal hover:bg-teal-700 text-white py-6 text-lg shadow-lg">
                            {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Save Profile Changes
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
