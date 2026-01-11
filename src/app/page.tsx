import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/navbar";
import { ScrollSpy } from "@/components/landing/scroll-spy";
import { 
  Heart, 
  Lightbulb, 
  Briefcase, 
  Check, 
  Sparkles, 
  Lock, 
  Zap, 
  MessageSquare,
  Rocket,
  LogIn
} from "lucide-react";

export default function Home() {
  const sections = [
    { id: "hero", label: "Home" },
    { id: "support", label: "Our Services" },
    { id: "emotion-reports", label: "Emotion Reports" },
    { id: "efficient-support", label: "Efficient Support" },
    { id: "smart-care", label: "Smart Care" },
    { id: "specialized-care", label: "Specialized Care" },
    { id: "technology", label: "Our Technology" },
    { id: "experts", label: "Our Experts" },
    { id: "testimonials", label: "Testimonials" },
    { id: "start-today", label: "Get Started" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* ScrollSpy Indicator */}
      <ScrollSpy sections={sections} />

      {/* Hero Section */}
      <section id="hero" className="pt-24 pb-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Start Your Mental Health Care Journey Today
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                We are here to provide you emotional clarity and appropriate mental care.
              </p>
              <div className="flex gap-4">
                <Link href="/register">
                  <Button className="rounded-full bg-black hover:bg-gray-800 text-white px-8 py-6 text-base flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    className="rounded-full border-2 border-black hover:bg-gray-50 px-8 py-6 text-base flex items-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative h-[450px] lg:h-[550px]">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-500 rounded-3xl overflow-hidden">
                <Image
                  src="/hero-illustration.png"
                  alt="Mental health journey illustration"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Support Across Three Critical Metrics Domains
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Emotion Analysis */}
            <div className="space-y-4">
              <div className="relative h-80 bg-white rounded-2xl overflow-hidden shadow-sm">
                <Image
                  src="/emotion-analysis.png"
                  alt="Emotion Analysis"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                Emotion Analysis
              </h3>
            </div>

            {/* Appointment Booking */}
            <div className="space-y-4">
              <div className="relative h-80 bg-white rounded-2xl overflow-hidden shadow-sm">
                <Image
                  src="/appointment-booking.png"
                  alt="Appointment Booking"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                Appointment Booking
              </h3>
            </div>

            {/* Counselor Recommendation */}
            <div className="space-y-4">
              <div className="relative h-80 bg-white rounded-2xl overflow-hidden shadow-sm">
                <Image
                  src="/counselor-recommendation.png"
                  alt="Counselor Recommendation"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                Counselor Recommendation
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Emotion Reports Section */}
      <section id="emotion-reports" className="py-28 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Laptop Mockup */}
            <div className="relative flex items-center justify-center">
              {/* Coral circle */}
              <div className="absolute left-0 top-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-orange-300 to-pink-400 opacity-80"></div>
              
              {/* Teal circle */}
              <div className="absolute right-0 bottom-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 opacity-80"></div>
              
              {/* Laptop mockup */}
              <div className="relative z-10 w-full max-w-md">
                {/* Laptop screen */}
                <div className="bg-gray-800 rounded-t-xl p-2 shadow-2xl">
                  <div className="bg-white rounded-lg overflow-hidden">
                    {/* Browser top bar */}
                    <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500">mindlens-ai.com</div>
                    </div>
                    
                    {/* Screen content */}
                    <div className="p-6 space-y-4">
                      <h3 className="text-2xl font-bold text-center text-gray-900">Emotion Reports</h3>
                      <p className="text-center text-gray-600 text-sm">
                        Track your Emotional State
                      </p>
                      
                      <div className="space-y-3 mt-6">
                        <div className="bg-gray-100 p-4 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500"></div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900">Sadness</div>
                              <div className="text-xs text-gray-500">15%</div>
                            </div>
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Laptop base */}
                <div className="relative">
                  <div className="bg-gray-300 h-2 rounded-b-xl"></div>
                  <div className="bg-gray-400 h-3 w-full" style={{ 
                    clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Intelligent Care For Your Emotional Well-being
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Gain emotional clarity, find specialized support, and understand your feelings through data-driven insights. Our platform provides real-time analysis and personalized care to help you on your mental wellness journey with professional care.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Access instant emotion reports, smart specialist recommendations, and seamless booking tools designed to simplify your path to professional care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Efficient Mental Health Support */}
      <section id="efficient-support" className="py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Get The Most Efficient Mental Health Support
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Discover our comprehensive mental health online learning guides along with patient centric matching, seamless booking and assured availability.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    AI-powered emotion recognition to help you identify exactly how to reach your goal.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    Smart recommendation engine to match you with the right counselor based on your needs.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    Seamless booking and instant availability checks with our Chatbot.
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Laptop Mockup */}
            <div className="relative flex items-center justify-center">
              {/* Laptop mockup */}
              <div className="relative z-10 w-full max-w-md">
                {/* Laptop screen */}
                <div className="bg-gray-800 rounded-t-xl p-2 shadow-2xl">
                  <div className="bg-gradient-to-b from-purple-50 to-pink-50 rounded-lg overflow-hidden aspect-video">
                    {/* Browser top bar */}
                    <div className="bg-white/70 backdrop-blur-sm px-4 py-2 flex items-center gap-2 border-b border-purple-100">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500">mindlens-ai.com</div>
                    </div>
                    
                    {/* Screen content */}
                    <div className="p-6 h-full flex flex-col">
                      <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Recommendations</h3>
                      
                      {/* Colorful circles */}
                      <div className="flex-1 flex items-center justify-center relative">
                        <div className="absolute top-2 left-8 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400"></div>
                        <div className="absolute top-6 right-12 w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-pink-500"></div>
                        <div className="absolute bottom-12 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-purple-300 to-purple-500"></div>
                        <div className="absolute bottom-6 right-8 w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-blue-500"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-teal-300 to-teal-500"></div>
                        <div className="absolute top-1/3 right-6 w-8 h-8 rounded-full bg-gradient-to-br from-green-300 to-green-500"></div>
                      </div>
                      
                      <div className="mt-auto pb-4">
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-500"></div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900">Dr. Suraj Karki</div>
                              <div className="text-xs text-gray-500">Psychiatrist in Nepal</div>
                            </div>
                            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Laptop base */}
                <div className="relative">
                  <div className="bg-gray-300 h-2 rounded-b-xl"></div>
                  <div className="bg-gray-400 h-3 w-full" style={{ 
                    clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' 
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Digital Mental Health Care */}
      <section id="smart-care" className="py-28 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Discover Smart Digital Mental Health Care
            </h2>
          </div>
          <p className="text-lg text-gray-600 mb-12 ml-16">
            Receive a personalized counselor match that fits your emotions and unique profile.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Emotion Cards */}
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image
                src="/emotion-sad.png"
                alt="Sad emotion"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image
                src="/emotion-happy.png"
                alt="Happy emotion"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image
                src="/emotion-excited.png"
                alt="Excited emotion"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Specialized Mental Care */}
      <section id="specialized-care" className="py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-6">
              <div className="w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Specialized Mental Care
            </h2>
            <p className="text-lg text-gray-600">
              Connect with expert counselors matched to your unique emotional profile and needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Emotional Clarity */}
            <Card className="border-0 bg-gradient-to-br from-pink-400 to-pink-500 text-white overflow-hidden">
              <CardContent className="p-8">
                <Lightbulb className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Emotional Clarity</h3>
                <p className="text-white/90 text-sm">
                  Identify feelings when words fall short
                </p>
              </CardContent>
            </Card>

            {/* Anxiety Relief */}
            <Card className="border-0 bg-gradient-to-br from-orange-400 to-orange-500 text-white overflow-hidden">
              <CardContent className="p-8">
                <Heart className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Anxiety Relief</h3>
                <p className="text-white/90 text-sm">
                  Find calm in moments of overwhelm
                </p>
              </CardContent>
            </Card>

            {/* Trauma Healing */}
            <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden">
              <CardContent className="p-8">
                <Sparkles className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Trauma Healing</h3>
                <p className="text-white/90 text-sm">
                  Recover safely with specialized professional guidance
                </p>
              </CardContent>
            </Card>

            {/* Work Burnout */}
            <Card className="border-0 bg-gradient-to-br from-teal-400 to-teal-500 text-white overflow-hidden">
              <CardContent className="p-8">
                <Briefcase className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Work Burnout</h3>
                <p className="text-white/90 text-sm">
                  Manage pressure and restore life balance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Technology */}
      <section id="technology" className="py-28 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900">
              Advanced Technology, Human-Centric Care
            </h2>
          </div>
          
          <p className="text-lg text-gray-600 leading-relaxed mb-8 ml-16">
            We combine privacy protocols, intelligent matching, and 24/7 assistance to ensure your path to mental wellness is safe, accurate, and seamless.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
                {/* Strict Auto-Deletion */}
                <div className="bg-white py-12 px-6 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-8">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Strict Auto-Deletion</h3>
                  <p className="text-gray-600 text-sm">
                    Your privacy is our priority. Video diaries are analyzed in real-time and permanently deleted from our servers immediately after emotion metrics are extracted.
                  </p>
                </div>
                
                {/* Precision Matching */}
                <div className="bg-white py-12 px-6 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-8">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Precision Matching</h3>
                  <p className="text-gray-600 text-sm">
                    Stop guessing. Our recommendation engine maps your specific emotional markers to counselors who specialize in exactly what you are feeling.
                  </p>
                </div>
                
                {/* AI Care Assistant */}
                <div className="bg-white py-12 px-6 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-8">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">AI Care Assistant</h3>
                  <p className="text-gray-600 text-sm">
                    Navigate care easily. Use our intelligent chatbot to instantly check counselor availability and manage bookings without the anxiety of phone calls.
                  </p>
                </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="experts" className="py-16 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Professional Care From Experts
            </h2>
          </div>
          <p className="text-lg text-gray-600 mb-8 ml-16">
            Connect with verified mental health professionals dedicated to your well-being.
          </p>

          <div className="relative">
            {/* Doctors Image */}
            <div className="relative h-[400px] mx-8 rounded-3xl overflow-hidden">
              <Image
                src="/doctors-team.png"
                alt="Mental Health Specialists Team"
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-cover"
              />
            </div>

            {/* Overlay Card */}
            <div className="relative -mt-16 mx-8">
              <Card className="bg-gray-400/90 backdrop-blur-sm border-0 rounded-none">
                <CardContent className="p-8 text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Discover Top Mental Health Specialists In Nepal
                  </h2>
                  <p className="text-white/90 text-base">
                    Get matched to experts who specialize in your specific mental health needs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Wall of Love - Testimonials */}
      <section id="testimonials" className="py-28 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-6">
              <div className="w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Wall of Love
            </h2>
            <p className="text-lg text-gray-600">
              Join these people who have improved their mental health and well-being.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="text-center space-y-4">
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
                <Image
                  src="/testimonial-1.jpg"
                  alt="Sabin Devkota"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <h4 className="text-gray-900">Sabin Devkota</h4>
              <p className="text-gray-600 text-sm italic">
                "This app completely addresses my insecurity of personal information disclosure."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="text-center space-y-4">
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
                <Image
                  src="/testimonial-2.jpg"
                  alt="Suraj Singh Thakuri"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <h4 className="text-gray-900">Suraj Singh Thakuri</h4>
              <p className="text-gray-600 text-sm italic">
                "The counseling sessions are now actually very helpful and effective."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="text-center space-y-4">
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
                <Image
                  src="/testimonial-3.jpg"
                  alt="Raymon Das Shrestha"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <h4 className="text-gray-900">Raymon Das Shrestha</h4>
              <p className="text-gray-600 text-sm italic">
                "Finally found a wellness app that actually understands my feelings"
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-primary mb-2">Secure</h3>
              <p className="text-gray-600">Auto Deletion Policy</p>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-bold text-primary mb-2">Personalized</h3>
              <p className="text-gray-600">Smart Recommendation Engine</p>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-bold text-primary mb-2">Accurate</h3>
              <p className="text-gray-600">AI Emotion Analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section id="start-today" className="py-36 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h2 className="text-5xl font-bold text-gray-900">
                Start today
              </h2>
              <p className="text-lg text-gray-600">
                Begin your journey to better mental health today. Sign up or Sign in now to get access to the best mental wellness app in the market.
              </p>
              <div className="flex gap-3">
                <Link href="/register">
                  <Button className="bg-black text-white min-w-[170px] py-6 rounded-lg flex items-center justify-center gap-2 border-2 border-black hover:bg-white hover:text-black hover:border-black transition">
                    <Rocket className="w-5 h-5" />
                    <span>Get Started</span>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-black text-white min-w-[120px] py-6 rounded-lg flex items-center justify-center gap-2 border-2 border-black hover:bg-white hover:text-black hover:border-black transition">
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Laptop Mockups */}
            <div className="relative flex items-center justify-center gap-8">
              {/* First Laptop - Emotion Reports */}
              <div className="relative w-80 transform -rotate-6">
                <div className="bg-gray-800 rounded-t-xl p-2 shadow-2xl">
                  <div className="bg-gradient-to-b from-purple-100 to-blue-100 rounded-lg overflow-hidden aspect-video">
                    <div className="bg-white/70 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 bg-white rounded px-2 py-0.5 text-xs text-gray-500">mindlens-ai.com</div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="text-center mt-2">
                        <h3 className="text-lg mb-1 font-semibold">Emotion Reports</h3>
                        <p className="text-xs text-gray-600">Summery of your emotions</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-gray-300 h-2 rounded-b-xl"></div>
                  <div className="bg-gray-400 h-3 w-full" style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}></div>
                </div>
              </div>

              {/* Second Laptop - Find a Counselor */}
              <div className="relative w-80 transform rotate-6">
                <div className="bg-gray-800 rounded-t-xl p-2 shadow-2xl">
                  <div className="bg-gradient-to-b from-pink-100 to-orange-100 rounded-lg overflow-hidden aspect-video">
                    <div className="bg-white/70 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 bg-white rounded px-2 py-0.5 text-xs text-gray-500">mindlens-ai.com</div>
                    </div>
                    <div className="p-4 h-full flex flex-col">
                      <div className="text-center">
                        <h3 className="text-lg mb-1 font-semibold">Find a counselor</h3>
                        <p className="text-xs text-gray-600">Browse manually or Get AI Recommendations</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-gray-300 h-2 rounded-b-xl"></div>
                  <div className="bg-gray-400 h-3 w-full" style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-8">
            {/* Column 1 - Logo */}
            <div>
              <Image
                src="/MindLens-AI_ Logo.svg"
                alt="MindLens AI"
                width={150}
                height={40}
                className="mb-3 brightness-0 invert"
                style={{ width: 'auto', height: 'auto' }}
              />
              <p className="text-white/90 text-sm">
                Your companion for mental wellness.
              </p>
            </div>

            {/* Column 2 - Get Started */}
            <div>
              <h4 className="font-semibold mb-4 text-base">Get Started</h4>
              <ul className="space-y-3 text-sm text-white/90">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            {/* Column 3 - Take a Test */}
            <div>
              <h4 className="font-semibold mb-4 text-base">Take a Test</h4>
              <ul className="space-y-3 text-sm text-white/90">
                <li><Link href="#" className="hover:text-white transition-colors">AI-Emotion Analysis</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Recommendation System</Link></li>
              </ul>
            </div>

            {/* Column 4 - Book an Appointment */}
            <div>
              <h4 className="font-semibold mb-4 text-base">Book an Appointment</h4>
              <ul className="space-y-3 text-sm text-white/90">
                <li><Link href="#" className="hover:text-white transition-colors">Browse Counselors</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Get AI-Chatbot Guidance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/30 pt-6 text-center text-sm text-white/80">
            © 2025 MindLens-AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
