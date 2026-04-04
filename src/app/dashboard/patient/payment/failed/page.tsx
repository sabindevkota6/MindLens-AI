import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ reason?: string }>;
}

const REASON_MESSAGES: Record<string, { title: string; body: string }> = {
  cancelled: {
    title: "Payment Cancelled",
    body: "You cancelled the payment. No charge was made and your slot has been released.",
  },
  verification_failed: {
    title: "Verification Failed",
    body: "We could not verify your payment. No charge was made and your slot has been released.",
  },
  finalize_error: {
    title: "Something Went Wrong",
    body: "Your payment was received but we had trouble confirming your appointment. Please contact support.",
  },
};

export default async function PaymentFailedPage({ searchParams }: PageProps) {
  const { reason } = await searchParams;
  const message = REASON_MESSAGES[reason ?? ""] ?? {
    title: "Payment Not Completed",
    body: "Something went wrong during payment. No charge was made and your slot has been released.",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] p-8 text-center">

        {/* failed icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{message.title}</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">{message.body}</p>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full gap-2">
            <Link href="/dashboard/patient">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full text-gray-500 gap-1">
            <Link href="/dashboard/patient">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
