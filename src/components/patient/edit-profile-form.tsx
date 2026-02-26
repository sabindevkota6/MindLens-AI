"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientProfileSchema } from "@/lib/schemas";
import { updatePatientProfile } from "@/lib/actions/patient";
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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
} from "lucide-react";

type ProfileFormValues = z.infer<typeof PatientProfileSchema>;

interface EditPatientProfileFormProps {
  initialData: any;
  email: string;
}

export default function EditPatientProfileForm({ initialData, email }: EditPatientProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(PatientProfileSchema) as any,
    defaultValues: {
      fullName: initialData?.fullName || "",
      dateOfBirth: formatDateForInput(initialData?.dateOfBirth) || "",
      phoneNumber: initialData?.user?.phoneNumber || "",
      bio: initialData?.bio || "",
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updatePatientProfile(values);
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
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        <Input placeholder="Sita Sharma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                About Me
              </h2>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5" />
                      Bio
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a bit about yourself..."
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
