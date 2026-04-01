"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ban, ShieldOff, Clock, ShieldCheck, Loader2, RotateCcw, CheckCircle } from "lucide-react";
import {
  adminBanUser,
  adminUnbanUser,
  adminSuspendUser,
  adminUnsuspendUser,
  adminVerifyCounselor,
  adminRevokeCounselorVerification,
} from "@/lib/actions/admin-user-management";

// ban dialog — requires admin to enter a reason
export function BanUserDialog({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleBan() {
    startTransition(async () => {
      const result = await adminBanUser(userId, reason);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${userName} has been banned.`);
        setOpen(false);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Ban className="w-4 h-4" />
          Ban User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <Ban className="w-5 h-5" />
            Ban {userName}
          </DialogTitle>
          <DialogDescription>
            This will permanently ban the user from MindLens AI. They will receive an email notification. You can unban them later from this page.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="ban-reason" className="text-sm font-medium text-gray-700">
            Reason <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="ban-reason"
            placeholder="Describe why this user is being banned..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-400">This reason will be included in the email sent to the user.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleBan}
            disabled={isPending || !reason.trim()}
            className="gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            Confirm Ban
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// unban dialog — simple confirmation
export function UnbanUserDialog({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnban() {
    startTransition(async () => {
      const result = await adminUnbanUser(userId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${userName}'s ban has been lifted.`);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <RotateCcw className="w-4 h-4" />
          Unban User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <RotateCcw className="w-5 h-5" />
            Unban {userName}
          </DialogTitle>
          <DialogDescription>
            This will restore full access to {userName}'s account. They will be able to use all platform features again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleUnban}
            disabled={isPending}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Confirm Unban
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// suspend dialog — admin chooses duration + reason
export function SuspendUserDialog({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("5");
  const [isPending, startTransition] = useTransition();

  function handleSuspend() {
    const d = parseInt(days, 10);
    if (isNaN(d) || d < 1 || d > 365) {
      toast.error("Days must be between 1 and 365.");
      return;
    }
    startTransition(async () => {
      const result = await adminSuspendUser(userId, d, reason);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${userName} has been suspended for ${d} day${d !== 1 ? "s" : ""}.`);
        setOpen(false);
        setReason("");
        setDays("5");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
          <Clock className="w-4 h-4" />
          Suspend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <Clock className="w-5 h-5" />
            Suspend {userName}
          </DialogTitle>
          <DialogDescription>
            The user will be locked out of all features except their profile. They receive an email notification.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="suspend-days" className="text-sm font-medium text-gray-700">
              Duration (days) <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              {["3", "5", "7", "14", "30"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    days === d
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                  }`}
                >
                  {d}d
                </button>
              ))}
              <Input
                id="suspend-days"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-20 h-9 text-sm"
                placeholder="days"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="suspend-reason" className="text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="suspend-reason"
              placeholder="Describe why this user is being suspended..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSuspend}
            disabled={isPending || !reason.trim() || !days}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            Confirm Suspension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// unsuspend dialog — simple confirmation
export function UnsuspendUserDialog({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnsuspend() {
    startTransition(async () => {
      const result = await adminUnsuspendUser(userId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${userName}'s suspension has been lifted.`);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <RotateCcw className="w-4 h-4" />
          Unsuspend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <RotateCcw className="w-5 h-5" />
            Unsuspend {userName}
          </DialogTitle>
          <DialogDescription>
            This will immediately restore {userName}'s full access before the suspension period ends.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleUnsuspend}
            disabled={isPending}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// verify counselor dialog — from user management detail page
export function VerifyCounselorDialog({
  counselorProfileId,
  counselorName,
}: {
  counselorProfileId: string;
  counselorName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleVerify() {
    startTransition(async () => {
      const result = await adminVerifyCounselor(counselorProfileId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${counselorName} has been verified.`);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
          <ShieldCheck className="w-4 h-4" />
          Verify
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-700">
            <ShieldCheck className="w-5 h-5" />
            Verify {counselorName}
          </DialogTitle>
          <DialogDescription>
            This will approve their verification and make them visible in the patient marketplace. An email will be sent notifying them.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isPending}
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirm Verification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// revoke verification dialog
export function RevokeVerificationDialog({
  counselorProfileId,
  counselorName,
}: {
  counselorProfileId: string;
  counselorName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      const result = await adminRevokeCounselorVerification(counselorProfileId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${counselorName}'s verification has been revoked.`);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
          <ShieldOff className="w-4 h-4" />
          Revoke Verification
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <ShieldOff className="w-5 h-5" />
            Revoke Verification
          </DialogTitle>
          <DialogDescription>
            This will set {counselorName}'s status back to Pending and hide them from the patient marketplace until re-verified. They will be notified by email.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
            Revoke
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
