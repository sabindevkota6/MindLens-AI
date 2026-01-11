import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile } from "@/lib/actions/counselor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase, Clock, CheckCircle, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function CounselorProfilePage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "COUNSELOR") {
        redirect("/login");
    }

    const profile = await getCounselorProfile();

    if (!profile) {
        return <div>Profile not found. Please contact support.</div>;
    }

    // Helper to extract initials
    const initials = profile.fullName
        ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
        : "DR";

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Section */}
            <div className="bg-brand-teal text-white pt-16 pb-24 px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                            <AvatarImage src={session.user.image || ""} />
                            <AvatarFallback className="bg-teal-800 text-3xl font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left space-y-3">
                            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                                <h1 className="text-4xl font-extrabold tracking-tight">{profile.fullName}</h1>
                                <Badge variant={profile.verificationStatus === "VERIFIED" ? "secondary" : "outline"} className={`uppercase tracking-widest px-3 py-1 ${profile.verificationStatus === "VERIFIED" ? "bg-white text-brand-teal" : "text-teal-100 border-teal-100"}`}>
                                    {profile.verificationStatus}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-teal-50 justify-center md:justify-start">
                                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {profile.experienceYears} Years Experience</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Online Counseling</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/dashboard/counselor/profile/edit">
                            <Button className="bg-white text-brand-teal hover:bg-teal-50 border-0 shadow-lg px-6 font-semibold gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Side: Stats & Details */}
                    <div className="space-y-6">
                        <Card className="shadow-xl border-0 overflow-hidden">
                            <CardHeader className="bg-white border-b border-gray-100">
                                <CardTitle className="text-lg font-bold text-gray-800">Practice Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-teal-100 rounded-lg">
                                            <ExternalLink className="w-5 h-5 text-brand-teal" />
                                        </div>
                                        <span className="font-medium text-gray-700">Hourly Rate</span>
                                    </div>
                                    <span className="text-2xl font-black text-brand-teal">${Number(profile.hourlyRate)}</span>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verification</h4>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${profile.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {profile.verificationStatus === 'VERIFIED' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{profile.verificationStatus === 'VERIFIED' ? 'Verified Professional' : 'Identity Pending'}</p>
                                            <p className="text-xs text-gray-500 leading-tight">
                                                {profile.verificationStatus === 'VERIFIED' ? 'Fully authorized to practice.' : 'Currently undergoing review.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side: Bio & Specialties */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="shadow-xl border-0">
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-brand-teal pl-4">Professional Bio</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg italic whitespace-pre-wrap">
                                        "{profile.bio || "No bio available yet."}"
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800">Specialties & Expertise</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {profile.specialties && profile.specialties.length > 0 ? (
                                            profile.specialties.map((s: any) => (
                                                <Badge key={s.specialtyId} className="px-4 py-1.5 bg-gray-100 text-gray-700 hover:bg-brand-teal hover:text-white transition-all cursor-default text-sm border-0 font-medium">
                                                    {s.specialty.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">No specialties listed</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview Disclaimer */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <ExternalLink className="w-5 h-5 text-amber-500 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                <strong>Public View:</strong> This is how your profile appears to potential patients. Ensure your bio and specialties accurately reflect your practice.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
