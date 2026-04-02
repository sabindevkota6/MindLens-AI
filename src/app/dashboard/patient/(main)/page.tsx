import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPatientProfile } from "@/lib/actions/patient";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, UserCheck, Clock, VideoIcon, Brain, CircleCheckBig } from "lucide-react";
import { FindCounselors } from "@/components/patient/find-counselors";

export default async function PatientDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getPatientProfile();
  const isProfileComplete = profile?.isOnboarded && profile?.dateOfBirth;
  if (!isProfileComplete) redirect("/dashboard/patient/onboarding");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="pt-16">
        <div className="bg-primary px-4 sm:px-6 lg:px-8 py-16 sm:py-20 pb-20 sm:pb-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-tight tracking-tight">
              Find Your Perfect Mental Health Professional
            </h1>
            <p className="text-white/85 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
              Connect with verified counselors and therapists who understand your needs
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <Link href="/dashboard/patient/emotion-test" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 text-primary border-0 rounded-xl px-6 sm:px-8 py-6 text-sm sm:text-base font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-black/10"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Take an Emotion Test
                </Button>
              </Link>
              <a href="#find-counselors" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#004D40] hover:bg-[#00352D] text-white border-0 rounded-xl px-6 sm:px-8 py-6 text-sm sm:text-base font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-black/20">
                  <VideoIcon className="w-5 h-5" />
                  Book a Session
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Wellness Info Section */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 bg-[#eef8f5] shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left - Illustration */}
                <div className="relative min-h-[260px] sm:min-h-[360px] lg:min-h-[480px] flex items-center justify-center p-4">
                  <Image
                    src="/wellness-illustration.png"
                    alt="Take care of your mental health"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain p-4"
                  />
                </div>

                {/* Right - Content */}
                <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center space-y-5 sm:space-y-6">
                  {/* Badge */}
                  <div>
                    <span className="inline-block bg-primary text-white text-sm font-medium px-5 py-2 rounded-full">
                      Your Mental Wellness Partner
                    </span>
                  </div>

                  {/* Heading */}
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    One Stop Platform for Your Mental Wellness
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 text-base leading-relaxed">
                    Connect with certified therapists, take personalized assessments, and access comprehensive mental health resources — all in one place.
                  </p>

                  {/* Feature Grid */}
                  <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-4 sm:gap-y-5 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Verified</p>
                        <p className="text-sm font-bold text-gray-900">Professionals</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">24/7</p>
                        <p className="text-sm font-bold text-gray-900">Support</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <VideoIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Secure</p>
                        <p className="text-sm font-bold text-gray-900">Sessions</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">AI Emotion</p>
                        <p className="text-sm font-bold text-gray-900">Recognition</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Find Counselors Section */}
      <FindCounselors />

      {/* AI-Powered Matching CTA */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-gradient-to-br from-[#00796B] to-[#009688]">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left - Content */}
                <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-center space-y-5 sm:space-y-6">
                  <div>
                    <span className="inline-block bg-white/15 text-white text-sm font-medium px-5 py-2 rounded-full backdrop-blur-sm">
                      AI-Powered Matching
                    </span>
                  </div>

                  <h2 className="text-3xl lg:text-[2.5rem] font-bold text-white leading-tight">
                    Tired of Manually Searching for the Right Counselor?
                  </h2>

                  <p className="text-white/75 text-base leading-relaxed max-w-lg">
                    Take an emotion test now and let AI find the best match for your emotional needs. Our advanced algorithm analyzes your responses to connect you with the perfect mental health professional.
                  </p>

                  <div className="pt-2 space-y-4">
                    <Link href="/dashboard/patient/emotion-test">
                      <Button className="bg-white hover:bg-gray-50 text-primary border-0 rounded-xl px-8 py-6 text-base font-semibold gap-2.5 shadow-lg shadow-black/10">
                        <CircleCheckBig className="w-5 h-5" />
                        Take an Emotion Test
                      </Button>
                    </Link>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Takes only 5 minutes • 100% Confidential</span>
                    </div>
                  </div>
                </div>

                {/* Right - Illustration */}
                <div className="relative hidden lg:flex items-center justify-center p-8">
                  <Image
                    src="/ai-matching-illustration.png"
                    alt="AI-powered counselor matching"
                    width={500}
                    height={400}
                    className="object-contain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}