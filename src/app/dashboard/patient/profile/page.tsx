import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPatientProfile } from "@/lib/actions/patient";
import { AppNavbar } from "@/components/shared/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default async function PatientProfilePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const profile = await getPatientProfile();

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Profile not found. Please contact support.</p>
      </div>
    );
  }

  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Not recorded";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      <div className="bg-primary pt-20 pb-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link
            href="/dashboard/patient"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <Link href="/dashboard/patient/profile/edit">
              <Button className="gap-2 bg-white text-primary hover:bg-white/90 transition-colors">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-primary mb-6">
                Personal Information
              </h2>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-28 h-28 border-4 border-slate-200 shadow-lg">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="bg-primary text-white px-4 py-1 text-sm">
                    Patient
                  </Badge>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <User className="w-3.5 h-3.5" />
                      Name
                    </div>
                    <p className="text-gray-900 font-medium">
                      {profile.fullName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      Date of Birth
                    </div>
                    <p className="text-gray-900 font-medium">
                      {formatDate(profile.dateOfBirth)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </div>
                    <p className="text-gray-900 font-medium">
                      {profile.user.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Phone className="w-3.5 h-3.5" />
                      Phone
                    </div>
                    <p className="text-gray-900 font-medium">
                      {profile.user.phoneNumber || "Not provided"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      Member Since
                    </div>
                    <p className="text-gray-900 font-medium">
                      {formatDate(profile.user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                About Me
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No bio added yet."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
