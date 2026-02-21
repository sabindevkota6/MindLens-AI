"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientOnboardingSchema } from "@/lib/schemas";
import { completePatientProfile } from "@/lib/actions/patient";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import {
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  FileText,
  Mail,
} from "lucide-react";

type OnboardingValues = z.infer<typeof PatientOnboardingSchema>;

interface PatientOnboardingFormProps {
  email: string;
}

export default function PatientOnboardingForm({
  email,
}: PatientOnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(PatientOnboardingSchema) as any,
    defaultValues: {
      dateOfBirth: "",
      phoneNumber: "",
      bio: "",
    },
  });

  const onSubmit = (values: OnboardingValues) => {
    setMessage(null);
    startTransition(async () => {
      const res = await completePatientProfile(values);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: res.success || "Profile completed!",
        });
        router.push("/dashboard/patient");
        router.refresh();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Email
          </label>
          <Input value={email} disabled className="bg-gray-50 text-gray-500" />
          <p className="text-xs text-gray-500">
            Your registered email address
          </p>
        </div>

        {/* Date of Birth */}
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Date of Birth <span className="text-red-500">*</span>
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
              <FormLabel className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Phone Number{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="9840XXXXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Bio{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a bit about yourself..."
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Feedback Message */}
        {message && (
          <div
            className={`flex items-center gap-2 p-4 rounded-xl ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Completing...
            </>
          ) : (
            "Complete Profile"
          )}
        </Button>
      </form>
    </Form>
  );
}
