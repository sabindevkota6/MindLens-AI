"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Shield,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { register as registerAction } from "@/lib/actions/auth";
import { RegisterSchema } from "@/lib/schemas";

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      role: undefined,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      const data = await registerAction(values);
      setError(data.error);
      setSuccess(data.success);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      {/* main card */}
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-[0_25px_80px_-12px_rgba(0,0,0,0.25)]">

        {/* left panel */}
        <div className="hidden md:flex flex-col bg-gradient-to-b from-[#0d9488] to-[#115e59] p-6 lg:p-8 text-white rounded-l-3xl">

          {/* logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-[#0f766e]/60 backdrop-blur-sm rounded-2xl px-5 py-2.5 border border-white/10">
              <Image
                src="/MindLens-AI_ Logo.svg"
                alt="MindLens-AI Logo"
                width={160}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </div>
          </div>

          {/* content */}
          <div className="flex-1 flex flex-col justify-center text-center px-2">
            <h1 className="text-2xl lg:text-3xl font-bold mb-3 leading-tight">
              Welcome to MindLens-AI
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">
              Your journey to mental wellness continues here. Sign in to get AI-Insights about your emotional state, access personalized support and connect with expert counselors.
            </p>
          </div>

          {/* stats */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/20">
            {/* 24/7 */}
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-1">
                <Clock className="w-4 h-4 text-teal-300" />
              </div>
              <p className="text-xl font-bold mb-0.5">24/7</p>
              <p className="text-[10px] text-white/60 leading-tight">
                Mental Health<br />Support
              </p>
            </div>

            {/* divider */}
            <div className="w-px h-12 bg-white/20" />

            {/* ai */}
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-1">
                <Sparkles className="w-4 h-4 text-teal-300" />
              </div>
              <p className="text-xl font-bold mb-0.5">AI</p>
              <p className="text-[10px] text-white/60 leading-tight">
                Smart Emotion<br />Insights
              </p>
            </div>

            {/* divider */}
            <div className="w-px h-12 bg-white/20" />

            {/* 100% */}
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-1">
                <Shield className="w-4 h-4 text-teal-300" />
              </div>
              <p className="text-xl font-bold mb-0.5">100%</p>
              <p className="text-[10px] text-white/60 leading-tight">
                Guaranteed<br />Privacy
              </p>
            </div>
          </div>
        </div>

        {/* form side */}
        <div className="bg-white p-5 lg:p-6 flex flex-col justify-center">

          {/* logo for mobile */}
          <div className="flex md:hidden items-center justify-center mb-4">
            <Image
              src="/MindLens-AI_ Logo.svg"
              alt="MindLens-AI Logo"
              width={200}
              height={50}
              className="h-12 w-auto"
            />
          </div>

          {/* header */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-medium md:font-bold text-gray-900 mb-1">Sign Up</h2>
            <p className="text-gray-400 text-sm">Create your account to get started</p>
          </div>

          {/* show error */}
          {(error || Object.keys(form.formState.errors).length > 0) && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 text-center">
                {error || Object.values(form.formState.errors)[0]?.message}
              </p>
            </div>
          )}

          {/* show success */}
          {success && (
            <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm text-emerald-600">{success}</p>
            </div>
          )}

          {/* form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5">

              {/* name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-600 text-sm font-medium">Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={1.5} />
                        <Input
                          placeholder="Enter your full name"
                          className="pl-11 h-10 bg-white border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-600 text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={1.5} />
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="pl-11 h-10 bg-white border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-600 text-sm font-medium">Select Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" strokeWidth={1.5} />
                          <SelectTrigger className="!w-full !h-10 pl-11 bg-white border-gray-200 rounded-xl text-gray-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PATIENT">Patient</SelectItem>
                        <SelectItem value="COUNSELOR">Counselor</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-600 text-sm font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={1.5} />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="pl-11 pr-11 h-10 bg-white border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                          ) : (
                            <Eye className="h-4 w-4" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* confirm password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-600 text-sm font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={1.5} />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="pl-11 pr-11 h-10 bg-white border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                          ) : (
                            <Eye className="h-4 w-4" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* submit */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 bg-brand-teal hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          {/* login link */}
          <p className="text-center mt-3 text-gray-500 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand-teal hover:text-teal-700 font-medium transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
