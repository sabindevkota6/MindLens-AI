import { redirect } from "next/navigation";
import { getCounselorDetail } from "@/lib/actions/counselor";
import { CounselorDetailView } from "@/components/patient/counselor-detail-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CounselorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; logId?: string }>;
}

export default async function CounselorPage({ params, searchParams }: CounselorPageProps) {
  const { id } = await params;
  const { from, logId } = await searchParams;
  const counselor = await getCounselorDetail(id);

  if (!counselor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-24 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Counselor not found
          </h2>
          <p className="text-gray-500">
            The counselor you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/dashboard/patient">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // back link varies by where user came from
  const back = from === "history" && logId
    ? { href: `/dashboard/patient/history/${logId}`, label: "Back to Result" }
    : from === "history"
      ? { href: "/dashboard/patient/history", label: "Back to History" }
      : from === "emotion-test"
        ? { href: "/dashboard/patient/emotion-test", label: "Back to Emotion Test" }
        : { href: "/dashboard/patient", label: "Back to Dashboard" };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {back.label}
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {counselor.fullName}
          </h1>
          {counselor.professionalTitle && (
            <p className="text-white/80">{counselor.professionalTitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-8 -mt-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <CounselorDetailView counselor={counselor} />
        </div>
      </div>
    </div>
  );
}
