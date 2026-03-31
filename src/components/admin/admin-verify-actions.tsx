"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveCounselorVerification,
  rejectCounselorVerification,
} from "@/lib/actions/admin-verification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export function AdminVerifyActions({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const r = await approveCounselorVerification(counselorId);
      if ("success" in r) {
        router.push("/dashboard/admin/verification");
        router.refresh();
      } else {
        alert(r.error);
      }
    });
  }

  function reject() {
    startTransition(async () => {
      const r = await rejectCounselorVerification(counselorId);
      if ("success" in r) {
        setRejectOpen(false);
        router.push("/dashboard/admin/verification");
        router.refresh();
      } else {
        alert(r.error);
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl px-6 shadow-lg shadow-primary/25"
          onClick={approve}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-red-300/80 text-red-700 hover:bg-red-50 gap-2 rounded-xl px-6"
          onClick={() => setRejectOpen(true)}
          disabled={pending}
        >
          <XCircle className="w-4 h-4" />
          Reject
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md border-red-100">
          <DialogHeader>
            <DialogTitle>Reject verification?</DialogTitle>
            <DialogDescription>
              The counselor will be emailed and can upload new documents. You
              can confirm to proceed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={reject}
              disabled={pending}
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
