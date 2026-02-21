"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CounselorOnboardingSchema } from "@/lib/schemas";
import { completeCounselorProfile } from "@/lib/actions/counselor";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import {
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  FileText,
  Mail,
  Briefcase,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Star,
  Plus,
  X,
} from "lucide-react";

type OnboardingValues = z.infer<typeof CounselorOnboardingSchema>;

interface SpecialtyOption {
  id: number;
  name: string;
}

interface CounselorOnboardingFormProps {
  email: string;
  specialties: SpecialtyOption[];
}

export default function CounselorOnboardingForm({
  email,
  specialties: availableSpecialties,
}: CounselorOnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [specialtyError, setSpecialtyError] = useState<string | null>(null);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(CounselorOnboardingSchema) as any,
    defaultValues: {
      bio: "",
      experienceYears: 0,
      hourlyRate: 0,
      dateOfBirth: "",
      phoneNumber: "",
      specialties: [],
      customSpecialties: [],
    },
    mode: "onChange",
  });

  const toggleSpecialty = (id: number) => {
    const updated = selectedSpecialties.includes(id)
      ? selectedSpecialties.filter((s) => s !== id)
      : [...selectedSpecialties, id];
    setSelectedSpecialties(updated);
    form.setValue("specialties", updated);
    setSpecialtyError(null);
  };

  const addCustomSpecialty = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customSpecialties.includes(trimmed)) {
      const updated = [...customSpecialties, trimmed];
      setCustomSpecialties(updated);
      form.setValue("customSpecialties", updated);
      setCustomInput("");
      setSpecialtyError(null);
    }
  };

  const removeCustomSpecialty = (name: string) => {
    const updated = customSpecialties.filter((s) => s !== name);
    setCustomSpecialties(updated);
    form.setValue("customSpecialties", updated);
  };

  const handleNext = async () => {
    // Validate step 1 fields before advancing
    const valid = await form.trigger(["dateOfBirth", "phoneNumber"]);
    if (valid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const onSubmit = (values: OnboardingValues) => {
    setMessage(null);
    startTransition(async () => {
      const res = await completeCounselorProfile(values);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: res.success || "Profile completed!",
        });
        router.push("/dashboard/counselor");
        router.refresh();
      }
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate specialty selection first
    const total =
      selectedSpecialties.length +
      customSpecialties.filter((s) => s.trim()).length;
    if (total === 0) {
      setSpecialtyError("Select or add at least one specialty");
    }

    // Sync specialties into form state
    form.setValue("specialties", selectedSpecialties);
    form.setValue("customSpecialties", customSpecialties);

    // Run react-hook-form validation for the other fields
    const valid = await form.trigger();
    if (!valid || total === 0) return;

    // All good — submit
    onSubmit(form.getValues());
  };

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-5">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge
            variant={step === 1 ? "default" : "secondary"}
            className={`rounded-full w-8 h-8 flex items-center justify-center p-0 ${
              step === 1
                ? "bg-primary"
                : step > 1
                ? "bg-emerald-500 text-white"
                : ""
            }`}
          >
            {step > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
          </Badge>
          <div
            className={`h-1 w-12 rounded-full ${
              step > 1 ? "bg-emerald-500" : "bg-gray-200"
            }`}
          />
          <Badge
            variant={step === 2 ? "default" : "secondary"}
            className={`rounded-full w-8 h-8 flex items-center justify-center p-0 ${
              step === 2 ? "bg-primary" : ""
            }`}
          >
            2
          </Badge>
        </div>

        {/* Step labels */}
        <div className="flex justify-between text-xs text-gray-500 px-2">
          <span className={step === 1 ? "text-primary font-medium" : ""}>
            Personal Info
          </span>
          <span className={step === 2 ? "text-primary font-medium" : ""}>
            Professional Details
          </span>
        </div>

        {/* ── STEP 1: Personal Info ── */}
        <div className={step === 1 ? "block space-y-5" : "hidden"}>
          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email
            </label>
            <Input
              value={email}
              disabled
              className="bg-gray-50 text-gray-500"
            />
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

          {/* Next Button */}
          <Button
            type="button"
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl font-semibold"
          >
            Next Step <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* ── STEP 2: Professional Details ── */}
        <div className={step === 2 ? "block space-y-5" : "hidden"}>
          {/* Bio */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Professional Bio <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your expertise and approach to mental health care..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Experience + Hourly Rate */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="experienceYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Experience (Years) <span className="text-red-500">*</span>
                  </FormLabel>
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
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Hourly Rate ($) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Specialties & Area of Expertise */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Specialties & Area of Expertise{" "}
              <span className="text-red-500">*</span>
            </label>

            {/* Existing specialties as toggleable chips */}
            {availableSpecialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableSpecialties.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSpecialty(s.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedSpecialties.includes(s.id)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* Custom specialties */}
            {customSpecialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customSpecialties.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeCustomSpecialty(name)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add custom specialty input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom specialty..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSpecialty();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomSpecialty}
                disabled={!customInput.trim()}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Select from the list or add your own specialties
            </p>
            {specialtyError && (
              <p className="text-sm font-medium text-destructive">
                {specialtyError}
              </p>
            )}
          </div>

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

          {/* Back & Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 py-6 rounded-xl font-semibold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-6 rounded-xl font-semibold"
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
          </div>
        </div>
      </form>
    </Form>
  );
}
