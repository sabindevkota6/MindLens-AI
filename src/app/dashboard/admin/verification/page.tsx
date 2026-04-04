import Link from "next/link";
import { format } from "date-fns";
import { listPendingCounselors } from "@/lib/actions/admin-verification";
import { CopyEmailButton } from "@/components/admin/copy-email-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ClipboardCheck,
  Clock,
  FileWarning,
  LayoutList,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminVerificationQueuePage() {
  const data = await listPendingCounselors();

  if ("error" in data) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 px-6 pb-12">
        <p className="text-destructive">{data.error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-16">
        <div className="bg-primary px-4 sm:px-6 lg:px-8 py-12 md:py-14 pb-20 md:pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex items-center gap-2 text-white/80">
                <LayoutList className="w-5 h-5" />
                <span className="text-sm font-medium">Admin · Verification</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Pending counselors
              </h1>
              <p className="text-white/80 text-base max-w-2xl leading-relaxed">
                Review license documents before counselors appear in the
                marketplace. Entries without a file stay in the queue until they
                upload.
              </p>
              <div className="flex items-center gap-2 pt-2 text-sm text-white/70">
                <ClipboardCheck className="w-4 h-4 text-white/90" />
                <span>{data.length} in queue</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="max-w-7xl mx-auto">
          {data.length === 0 ? (
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="py-14 text-center text-muted-foreground">
                No counselors in the queue.
              </CardContent>
            </Card>
          ) : (
            <ul className="grid auto-rows-[1fr] gap-5 sm:grid-cols-2 xl:grid-cols-2">
              {data.map((c, i) => {
                const statusLabel = c.hasDocuments
                  ? "Awaiting review"
                  : "No document uploaded";
                const statusStyle = c.hasDocuments
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-amber-200 bg-amber-50 text-amber-900";

                return (
                  <li
                    key={c.id}
                    className={cn(
                      "group flex h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards"
                    )}
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <Card className="h-full min-h-0 w-full border-gray-100 shadow-sm transition hover:shadow-md hover:border-gray-200">
                      <CardContent className="flex flex-1 flex-col pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-gray-900 truncate">
                              {c.fullName}
                            </h2>
                            <div className="mt-1 flex items-center gap-1 min-w-0">
                              <span className="truncate text-sm text-gray-600">
                                {c.email}
                              </span>
                              <CopyEmailButton email={c.email} />
                            </div>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                              statusStyle
                            )}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {c.specialties.map((s) => (
                            <span
                              key={s.id}
                              className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                          <span>
                            {c.professionalTitle || "Counselor"} ·{" "}
                            {c.experienceYears} yrs
                          </span>
                          <span className="hidden sm:inline text-gray-300">·</span>
                          <span>Rs. {Number(c.hourlyRate).toLocaleString()}/hr</span>
                          <span className="hidden sm:inline text-gray-300">·</span>
                          <span className="inline-flex items-center gap-1">
                            <FileWarning className="h-3.5 w-3.5 text-gray-400" />
                            {c.documentCount} file
                            {c.documentCount !== 1 ? "s" : ""}
                          </span>
                          {c.lastUploadedAt && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Last upload{" "}
                              {format(
                                new Date(c.lastUploadedAt),
                                "MMM d, yyyy · h:mm a"
                              )}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/dashboard/admin/verification/${c.id}`}
                          className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary transition group-hover:gap-3"
                        >
                          View details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
