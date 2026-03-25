import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, Upload, CalendarCog } from "lucide-react";

type PendingReviewCopy = "detailed" | "short";

const DEFAULT_PENDING_NO_DOC =
  "You haven't submitted a professional license or certificate yet. Upload a document so we can verify your account and list you for patients.";

const DEFAULT_REJECTED =
  "Your verification documents were rejected. Please re-upload a valid professional license or certificate.";

export interface CounselorVerificationAlertsProps {
  verificationStatus: string;
  hasVerificationDoc: boolean;
  /** Extra line on dashboard for pending + document submitted */
  pendingReviewCopy?: PendingReviewCopy;
  /** Full body when pending + document exists (overrides `pendingReviewCopy` presets) */
  pendingReviewBodyOverride?: string;
  /** Body paragraph when pending + no document on file */
  pendingNoDocumentBodyOverride?: string;
  /** Rejected state description (paragraph only) */
  rejectedDescriptionOverride?: string;
  /**
   * Show “Change document” (onboarding step 3) for PENDING+doc and REJECTED.
   * Set false only if you surface the same action elsewhere on the page.
   */
  showChangeDocumentButton?: boolean;
  className?: string;
}

/**
 * Status banners for counselors who are not yet verified (PENDING / REJECTED).
 * Reused across dashboard, availability, appointments, etc.
 */
export function CounselorVerificationAlerts({
  verificationStatus,
  hasVerificationDoc,
  pendingReviewCopy = "short",
  pendingReviewBodyOverride,
  pendingNoDocumentBodyOverride,
  rejectedDescriptionOverride,
  showChangeDocumentButton = true,
  className,
}: CounselorVerificationAlertsProps) {
  if (verificationStatus === "VERIFIED") {
    return null;
  }

  const pendingReviewBody =
    pendingReviewBodyOverride ??
    (pendingReviewCopy === "detailed"
      ? "Your verification document has been received and is being reviewed by our team. You will be visible in the marketplace once approved. This usually takes 1–2 business days."
      : "Your verification document has been received and is being reviewed by our team. You will be visible in the marketplace once approved.");

  const pendingNoDocBody =
    pendingNoDocumentBodyOverride ?? DEFAULT_PENDING_NO_DOC;

  const rejectedBody = rejectedDescriptionOverride ?? DEFAULT_REJECTED;

  const changeDocumentHref = "/dashboard/counselor/onboarding?step=3";

  return (
    <div className={className ?? "space-y-6"}>
      {verificationStatus === "PENDING" && hasVerificationDoc && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <Clock className="h-4 w-4 !text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">Account Under Review</AlertTitle>
          <AlertDescription className="text-amber-700 space-y-3">
            <p>{pendingReviewBody}</p>
            {showChangeDocumentButton && (
              <Link
                href={changeDocumentHref}
                className="flex w-full justify-end"
              >
                <Button
                  size="sm"
                  className="bg-amber-700 hover:bg-amber-800 text-white border-0 gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Change document
                </Button>
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
      {verificationStatus === "PENDING" && !hasVerificationDoc && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <Upload className="h-4 w-4 !text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">Verification document required</AlertTitle>
          <AlertDescription className="text-amber-700 space-y-3">
            <p>{pendingNoDocBody}</p>
            <Link
              href="/dashboard/counselor/onboarding?step=3"
              className="flex w-full justify-end"
            >
              <Button
                size="sm"
                className="bg-amber-700 hover:bg-amber-800 text-white border-0 gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload now
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
      {verificationStatus === "REJECTED" && (
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertTriangle className="h-4 w-4 !text-red-600" />
          <AlertTitle className="text-red-800 font-semibold">Verification Rejected</AlertTitle>
          <AlertDescription className="text-red-700 space-y-3">
            <p>{rejectedBody}</p>
            {showChangeDocumentButton && (
              <Link
                href={changeDocumentHref}
                className="flex w-full justify-end"
              >
                <Button
                  size="sm"
                  className="bg-amber-700 hover:bg-amber-800 text-white border-0 gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Change document
                </Button>
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export interface CounselorSchedulingLockedCardProps {
  className?: string;
}

/** Placeholder shown when scheduling tools are locked until admin verification. */
export function CounselorSchedulingLockedCard({ className }: CounselorSchedulingLockedCardProps) {
  return (
    <Card className={className ?? "border-0 shadow-sm"}>
      <CardContent className="py-20 text-center space-y-3">
        <div className="flex justify-center mb-2">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <CalendarCog className="w-7 h-7 text-gray-400" />
          </div>
        </div>
        <p className="text-gray-600 font-medium">Scheduling features are unavailable</p>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Your appointment scheduling tools will unlock once your account is verified by an administrator.
        </p>
      </CardContent>
    </Card>
  );
}
