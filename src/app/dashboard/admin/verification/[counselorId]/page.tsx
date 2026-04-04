import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getCounselorVerificationDetail } from "@/lib/actions/admin-verification";
import { VerificationDocDownloadButton } from "@/components/admin/verification-doc-download-button";
import { AdminVerifyActions } from "@/components/admin/admin-verify-actions";
import { CopyEmailButton } from "@/components/admin/copy-email-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ClipboardCheck,
  Mail,
  Phone,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const seg = path.split("/").filter(Boolean).pop();
    return seg ? decodeURIComponent(seg) : "Document";
  } catch {
    return "Document";
  }
}

export default async function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ counselorId: string }>;
}) {
  const { counselorId } = await params;
  const data = await getCounselorVerificationDetail(counselorId);

  if (data && "error" in data) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 px-6 pb-12">
        <p className="text-destructive">{data.error}</p>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-16">
        <div className="bg-primary px-4 sm:px-6 lg:px-8 py-10 md:py-12 pb-20 md:pb-24">
          <div className="max-w-7xl mx-auto space-y-4">
            <Link
              href="/dashboard/admin/verification"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to queue
            </Link>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-white/70 mb-2">
                  <ClipboardCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Verification review</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {data.fullName}
                </h1>
                <p className="mt-2 text-white/80 text-base max-w-2xl">
                  {data.professionalTitle || "Counselor"} · pending verification
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <Card className="border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Contact and professional details from onboarding.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 text-sm">
                <div className="flex flex-wrap items-start gap-2">
                  <dt className="flex min-w-[7rem] items-center gap-2 text-gray-500">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    Email
                  </dt>
                  <dd className="flex flex-1 flex-wrap items-center gap-1 font-medium text-gray-900">
                    {data.email}
                    <CopyEmailButton email={data.email} />
                  </dd>
                </div>
                {data.phoneNumber && (
                  <div className="flex flex-wrap gap-2">
                    <dt className="flex min-w-[7rem] items-center gap-2 text-gray-500">
                      <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                      Phone
                    </dt>
                    <dd className="text-gray-900">{data.phoneNumber}</dd>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <dt className="flex min-w-[7rem] items-center gap-2 text-gray-500">
                    <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
                    Rate / experience
                  </dt>
                  <dd className="text-gray-900">
                    Rs. {Number(data.hourlyRate).toLocaleString()}/hr · {data.experienceYears}{" "}
                    years
                  </dd>
                </div>
                {data.dateOfBirth && (
                  <div className="flex flex-wrap gap-2">
                    <dt className="flex min-w-[7rem] items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                      Date of birth
                    </dt>
                    <dd className="text-gray-900">
                      {format(new Date(data.dateOfBirth), "PPP")}
                    </dd>
                  </div>
                )}
                {data.bio && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Bio
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {data.bio}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {data.specialties.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 shadow-sm h-fit animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75 fill-mode-forwards">
              <CardHeader>
                <CardTitle className="text-lg">Decision</CardTitle>
                <CardDescription>
                  Approve to publish on the marketplace, or reject so they can
                  re-upload documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminVerifyActions counselorId={data.id} />
              </CardContent>
            </Card>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100 fill-mode-forwards">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Document history
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Newest first. Open uses a short-lived secure link.
            </p>

            {data.documents.length === 0 ? (
              <Card className="mt-6 border-amber-200 bg-amber-50/80 shadow-sm">
                <CardContent className="py-10 text-center">
                  <p className="text-sm font-semibold text-amber-900">
                    No document uploaded yet
                  </p>
                  <p className="mt-1 text-sm text-amber-800/90">
                    Counselor can upload from onboarding when ready.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative mt-8 pl-2">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-gray-200 to-gray-200" />
                <ul className="space-y-0">
                  {data.documents.map((doc, index) => (
                    <li key={doc.id} className="relative pb-10 pl-10 last:pb-0">
                      <div
                        className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm ring-2 ${
                          index === 0 ? "ring-primary/30" : "ring-gray-200"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            index === 0 ? "bg-primary" : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <Card className="border-gray-100 shadow-sm transition hover:border-gray-200 hover:shadow-md">
                        <CardContent className="py-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {filenameFromUrl(doc.documentUrl)}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {format(
                                  new Date(doc.uploadedAt),
                                  "MMMM d, yyyy · h:mm a"
                                )}
                              </p>
                            </div>
                            <VerificationDocDownloadButton
                              documentId={doc.id}
                              label="Open / download"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
