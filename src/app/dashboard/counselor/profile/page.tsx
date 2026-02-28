import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCounselorProfile } from "@/lib/actions/counselor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Wallet,
  CheckCircle,
  Clock,
  Edit,
  Star,
  FileText,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { DocumentUploadDialog } from "@/components/counselor/document-upload-dialog";

export default async function CounselorProfilePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "COUNSELOR") {
    redirect("/login");
  }

  const profile = await getCounselorProfile();

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

  const verificationColor =
    profile.verificationStatus === "VERIFIED"
      ? "text-emerald-600 bg-emerald-50"
      : profile.verificationStatus === "REJECTED"
      ? "text-red-600 bg-red-50"
      : "text-amber-600 bg-amber-50";

  const verificationLabel =
    profile.verificationStatus === "VERIFIED"
      ? "Verified"
      : profile.verificationStatus === "REJECTED"
      ? "Rejected"
      : "Pending Verification";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Green banner header */}
      <div className="bg-primary pt-20 pb-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Back link */}
          <Link
            href="/dashboard/counselor"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Page title + Edit button */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">
              Counselor Profile
            </h1>
            <Link href="/dashboard/counselor/profile/edit">
              <Button
                className="gap-2 bg-white text-primary hover:bg-white/90 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 md:px-8 -mt-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ─── Personal Information Card ─── */}
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-primary mb-6">
                Personal Information
              </h2>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar + Role Badge */}
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-28 h-28 border-4 border-slate-200 shadow-lg">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="bg-primary text-white px-4 py-1 text-sm">
                    {profile.professionalTitle || "Counselor"}
                  </Badge>
                </div>

                {/* Info Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                  {/* Name */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5" />
                      Name
                    </div>
                    <p className="text-gray-900 font-medium">
                      {profile.fullName}
                    </p>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      Date of Birth
                    </div>
                    <p className="text-gray-900 font-medium">
                      {formatDate(profile.dateOfBirth)}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </div>
                    <p className="text-gray-900 font-medium">
                      {profile.user.email}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Phone className="w-3.5 h-3.5" />
                      Phone
                    </div>
                    <p className="text-gray-900 font-medium">
                      {profile.user.phoneNumber || "Not provided"}
                    </p>
                  </div>

                  {/* Experience */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5" />
                      Experience
                    </div>
                    <p className="text-gray-900 font-medium">
                      {profile.experienceYears}{" "}
                      {profile.experienceYears === 1 ? "Year" : "Years"}
                    </p>
                  </div>

                  {/* Hourly Rate */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Wallet className="w-3.5 h-3.5" />
                      Hourly Rate (NPR)
                    </div>
                    <p className="text-gray-900 font-semibold text-lg">
                      NPR {Number(profile.hourlyRate)}
                    </p>
                  </div>

                  {/* Verification Status */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verification Status
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${verificationColor}`}
                      >
                        {profile.verificationStatus === "VERIFIED" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {verificationLabel}
                      </span>
                    </div>
                  </div>

                  {/* Member Since */}
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

          {/* ─── Professional Bio Card ─── */}
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Professional Bio
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No bio available yet."}
              </p>
            </CardContent>
          </Card>

          {/* ─── Specialties Card ─── */}
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Specialties & Expertise
              </h2>
              {profile.specialties && profile.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((s: any) => (
                    <Badge
                      key={s.specialtyId}
                      variant="secondary"
                      className="px-4 py-1.5 bg-primary/10 text-primary border-0 text-sm font-medium"
                    >
                      {s.specialty.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No specialties listed yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ─── Documents Card ─── */}
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Verification Documents
              </h2>
              {profile.documents && profile.documents.length > 0 ? (
                <div className="space-y-3">
                  {profile.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Verification Document
                          </p>
                          <p className="text-xs text-gray-400">
                            Uploaded on {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={verificationColor}
                      >
                        {verificationLabel}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No documents uploaded yet.
                </p>
              )}
              {profile.verificationStatus === "PENDING" && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-700">
                    Note: Your profile will not be visible to users/patients until you are verified.
                  </p>
                </div>
              )}
              {profile.verificationStatus === "REJECTED" && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                  <p className="text-sm text-red-700">
                    Your verification was rejected. You can change the verification document and try again.
                  </p>
                  <DocumentUploadDialog />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
