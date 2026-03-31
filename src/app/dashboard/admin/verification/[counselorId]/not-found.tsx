import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminVerificationNotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 pt-24 pb-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
          Not in queue
        </h1>
        <p className="mt-3 text-gray-600">
          This counselor is not pending verification, or the link is invalid.
        </p>
        <Button asChild className="mt-8 rounded-full" variant="default">
          <Link href="/dashboard/admin/verification">Back to queue</Link>
        </Button>
      </div>
    </div>
  );
}
