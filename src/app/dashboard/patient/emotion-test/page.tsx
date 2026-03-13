import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Video,
  Lightbulb,
  VolumeX,
  User,
  AlertCircle,
  Shield,
  Cpu,
  Lock,
  Clock,
} from "lucide-react";

export default async function EmotionTestPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const preparationTips = [
    {
      icon: Lightbulb,
      title: "Good Lighting",
      subtitle: "Face visible",
      color: "text-[#e0a100]",
      bg: "bg-[#f6e8aa]",
    },
    {
      icon: VolumeX,
      title: "Quiet Space",
      subtitle: "No noise",
      color: "text-[#3b82f6]",
      bg: "bg-[#dbeafe]",
    },
    {
      icon: User,
      title: "Face Visible",
      subtitle: "Stay centered",
      color: "text-[#0f9d8a]",
      bg: "bg-[#c7efe6]",
    },
  ];

  const suggestedPrompts = [
    "Talk about sleep",
    "Describe your stress",
    "Rate your energy",
    "Recent challenges",
    "Daily mood",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* teal header */}
      <section className="pt-16">
        <div className="bg-primary px-4 md:px-8 py-14 pb-16">
          <div className="max-w-7xl mx-auto">
            {/* back link */}
            <Link
              href="/dashboard/patient"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="max-w-4xl mx-auto text-center space-y-4">
              {/* badge */}
              <div>
                <span className="inline-block bg-white/15 text-white text-sm font-medium px-5 py-1.5 rounded-full backdrop-blur-sm">
                  AI Emotion Analysis
                </span>
              </div>

              {/* heading */}
              <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-white leading-tight tracking-tight">
                How are you feeling right now?
              </h1>

              {/* description */}
              <p className="text-white/80 text-base max-w-xl mx-auto leading-relaxed">
                Speak freely for up to 2 minutes. Our AI will analyze your
                facial expressions and tone to provide insights about your
                emotional state.
              </p>

              {/* feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">
                      AI-Powered
                    </p>
                    <p className="text-white/60 text-xs">
                      Real-time analysis
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">
                      100% Private
                    </p>
                    <p className="text-white/60 text-xs">Auto-deleted</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">
                      2 Minutes
                    </p>
                    <p className="text-white/60 text-xs">Quick & easy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* medical disclaimer */}
      <section className="px-4 md:px-8 -mt-6">
        <div className="max-w-7xl mx-auto">
            <div className="bg-[#eef8f5] border border-[#bfe6dc] rounded-xl px-5 py-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#2c5c55] leading-relaxed">
              <span className="font-semibold">Medical Disclaimer:</span> This
              tool is for self-awareness only and does not provide a medical
              diagnosis. If you are in crisis, please contact emergency services
              immediately.
            </p>
          </div>
        </div>
      </section>

      {/* main recording card */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-7">
              <div className="max-w-5xl mx-auto">
                <Card className="max-w-3xl mx-auto border border-[#c9e3db] shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-[#b7d9cf] via-[#d9eee7] to-[#f7fcfa]">
                  <CardContent className="px-8 py-6 md:px-9 md:py-7 flex flex-col items-center text-center space-y-5">
                    {/* video icon */}
                    <div className="w-[88px] h-[88px] rounded-[16px] bg-primary flex items-center justify-center shadow-sm">
                      <Video className="w-9 h-9 text-white" strokeWidth={2.1} />
                    </div>

                    {/* title */}
                    <div className="space-y-3">
                      <h2 className="text-[1.8rem] leading-none font-medium tracking-[-0.03em] text-slate-900">
                        Take a Emotion test
                      </h2>
                      <p className="text-[15px] font-medium text-slate-700">
                        Prepare Your Environment
                      </p>
                    </div>

                    {/* preparation tips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                      {preparationTips.map((tip) => (
                        <div
                          key={tip.title}
                          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#d7dde2] bg-white py-3 px-3 min-h-[78px] shadow-[0_1px_0_rgba(15,23,42,0.02)]"
                        >
                          <div
                            className={`w-8 h-8 rounded-full ${tip.bg} flex items-center justify-center`}
                          >
                            <tip.icon className={`w-[15px] h-[15px] ${tip.color}`} strokeWidth={2} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[13px] leading-none font-semibold text-slate-900">
                              {tip.title}
                            </p>
                            <p className="text-[11px] text-slate-500">{tip.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* note */}
                    <div className="w-full rounded-2xl border border-[#d2d9de] bg-white px-5 py-3">
                      <p className="text-[12px] leading-[1.55] text-[#175f58] text-center">
                        <span className="font-semibold text-[#0f5d55]">Note:</span>{" "}
                        Environmental factors like background noise and video quality
                        can affect the accuracy of the analysis.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* start recording button */}
                <div className="flex justify-center mt-6">
                  <Button className="bg-primary hover:bg-[#00695C] text-white rounded-xl px-9 py-5 text-base font-semibold gap-2.5 shadow-[0_12px_24px_rgba(0,121,107,0.19)]">
                    <div className="w-4 h-4 rounded-full border-2 border-white" />
                    Start Recording
                  </Button>
                </div>

                {/* suggested prompts */}
                <div className="text-center mt-5 space-y-2.5">
                  <p className="text-sm text-gray-500">
                    Need help getting started? Try these prompts:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        className="px-4 py-1.5 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* privacy guarantee */}
      <section className="px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.1} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Your Privacy is Guaranteed
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This video is analyzed in real-time using advanced AI technology
                and permanently deleted immediately after the emotional analysis
                report is generated. We never store, share, or retain your video
                recordings.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
