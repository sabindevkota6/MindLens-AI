import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPatientProfile } from "@/lib/actions/patient";
import Link from "next/link";
import Image from "next/image";
import { AppNavbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Video, UserCheck, Clock, VideoIcon, Brain } from "lucide-react";
import { FindCounselors } from "@/components/patient/find-counselors";

export default async function PatientDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getPatientProfile();
  const isProfileComplete = profile?.isOnboarded && profile?.dateOfBirth;
  if (!isProfileComplete) redirect("/dashboard/patient/onboarding");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      {/* Hero Banner */}
      <section className="pt-16">
        <div className="bg-primary px-6 lg:px-8 py-20 pb-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-tight tracking-tight">
              Find Your Perfect Mental{"\n"}Health Professional
            </h1>
            <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto">
              Connect with verified counselors and therapists who understand your needs
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/emotion-test">
                <Button
                  variant="outline"
                  className="bg-white hover:bg-gray-50 text-primary border-0 rounded-xl px-8 py-6 text-base font-semibold flex items-center gap-2.5 shadow-lg shadow-black/10 min-w-[240px]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Take an Emotion Test
                </Button>
              </Link>
              <Link href="/book-session">
                <Button className="bg-[#004D40] hover:bg-[#00352D] text-white border-0 rounded-xl px-8 py-6 text-base font-semibold flex items-center gap-2.5 shadow-lg shadow-black/20 min-w-[240px]">
                  <Video className="w-5 h-5" />
                  Book a Session
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Wellness Info Section */}
      <section className="bg-white px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 bg-[#eef8f5] shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left - Illustration */}
                <div className="relative min-h-[400px] lg:min-h-[480px] flex items-center justify-center p-4">
                  <Image
                    src="/wellness-illustration.png"
                    alt="Take care of your mental health"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain p-4"
                  />
                </div>

                {/* Right - Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6">
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
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5 pt-2">
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

    </div>
  );
}