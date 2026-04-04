"use client";

import { useRef, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  UserCheck,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotId: string;
  counselorName: string;
  amountNpr: number;
  medicalConcern?: string;
  emotionLogId?: string;
  onPaymentResult: (result: { success?: string; error?: string }) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  slotId,
  counselorName,
  amountNpr,
  medicalConcern,
  emotionLogId,
  onPaymentResult,
}: PaymentDialogProps) {
  const [selectedGateway, setSelectedGateway] = useState<"KHALTI" | "PAYPAL" | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // ref mirrors pendingAppointmentId so paypal sdk callbacks (onError, onCancel)
  // always read the latest value — sdk callbacks capture the closure at creation time
  // and will see stale state if we only use useState
  const pendingAppointmentIdRef = useRef<string | null>(null);
  const paymentCompletedRef = useRef(false);
  // stores the error message from createPaypalOrder so onError can surface it
  // instead of overwriting it with the generic "payment failed" message
  const createOrderErrorRef = useRef<string | null>(null);

  const amountUsd = (amountNpr / Number(process.env.NEXT_PUBLIC_NPR_TO_USD_RATE ?? 148.70)).toFixed(2);

  const handleOpenChange = (open: boolean) => {
    // if user closes dialog without completing payment, release the held slot
    if (!open && pendingAppointmentIdRef.current && !paymentCompletedRef.current) {
      fetch("/api/payment/paypal/cancel-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: pendingAppointmentIdRef.current }),
      }).catch(console.error);
    }
    if (!open) {
      setSelectedGateway(null);
      setError(null);
      setPendingAppointmentId(null);
      pendingAppointmentIdRef.current = null;
      setPaymentCompleted(false);
      paymentCompletedRef.current = false;
      createOrderErrorRef.current = null;
      setIsInitiating(false);
    }
    onOpenChange(open);
  };

  const handleKhaltiInitiate = async () => {
    setIsInitiating(true);
    setError(null);

    const res = await fetch("/api/payment/khalti/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, medicalConcern, emotionLogId }),
    });

    const data = await res.json() as { payment_url?: string; error?: string };

    if (!res.ok || !data.payment_url) {
      setError(data.error ?? "Failed to initiate payment. Please try again.");
      setIsInitiating(false);
      return;
    }

    // browser leaves the app — khalti will redirect back to /api/payment/khalti/verify
    window.location.href = data.payment_url;
  };

  // paypal createOrder fires when user clicks the paypal button
  const createPaypalOrder = async () => {
    setError(null);
    createOrderErrorRef.current = null;
    const res = await fetch("/api/payment/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, medicalConcern, emotionLogId }),
    });
    const data = await res.json() as { orderId?: string; appointmentId?: string; error?: string };
    if (!res.ok || !data.orderId) {
      const msg = data.error ?? "Failed to create order. Please try again.";
      createOrderErrorRef.current = msg;
      throw new Error(msg);
    }
    setPendingAppointmentId(data.appointmentId ?? null);
    pendingAppointmentIdRef.current = data.appointmentId ?? null;
    return data.orderId!;
  };

  // release the slot and reset state so the user can retry cleanly
  const cancelPendingAndReset = async (apptId: string) => {
    setPendingAppointmentId(null);
    pendingAppointmentIdRef.current = null;
    await fetch("/api/payment/paypal/cancel-pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: apptId }),
    }).catch(console.error);
  };

  // paypal onApprove fires after user approves in the popup
  const capturePaypalOrder = async (data: { orderID: string }) => {
    const res = await fetch("/api/payment/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: data.orderID, appointmentId: pendingAppointmentId }),
    });
    const result = await res.json() as { success?: boolean; appointmentId?: string; error?: string };
    if (!res.ok) {
      setError(result.error ?? "Payment capture failed. Your slot has been released.");
      return;
    }
    setPaymentCompleted(true);
    paymentCompletedRef.current = true;
    onPaymentResult({ success: "Appointment booked! Check your email for confirmation." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">

        {/* compact teal header */}
        <div className="bg-gradient-to-r from-[#00796B] to-[#00897B] px-6 py-4 shrink-0">
          <DialogTitle className="text-base font-semibold text-white leading-tight">
            Complete Your Booking
          </DialogTitle>
          <p className="text-xs text-white/70 mt-0.5">Session with {counselorName}</p>
        </div>

        <div className="px-6 pt-5 pb-6 space-y-5 overflow-y-auto flex-1">

          {/* amount display */}
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Amount Due</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">
              Rs. {amountNpr.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">≈ USD ${amountUsd} · 60 min session</p>
          </div>

          {/* gateway selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-3">

              {/* khalti */}
              <button
                type="button"
                onClick={() => { setSelectedGateway("KHALTI"); setError(null); }}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
                  selectedGateway === "KHALTI"
                    ? "border-violet-500 bg-violet-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {selectedGateway === "KHALTI" && (
                  <UserCheck className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-violet-500" />
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  selectedGateway === "KHALTI" ? "bg-violet-100" : "bg-gray-100"
                )}>
                  <Wallet className={cn("w-5 h-5", selectedGateway === "KHALTI" ? "text-violet-600" : "text-gray-400")} />
                </div>
                <div className="text-center">
                  <p className={cn("text-sm font-semibold", selectedGateway === "KHALTI" ? "text-violet-700" : "text-gray-700")}>
                    Khalti
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Pay in NPR</p>
                </div>
              </button>

              {/* paypal */}
              <button
                type="button"
                onClick={() => { setSelectedGateway("PAYPAL"); setError(null); }}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
                  selectedGateway === "PAYPAL"
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {selectedGateway === "PAYPAL" && (
                  <UserCheck className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-blue-500" />
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  selectedGateway === "PAYPAL" ? "bg-blue-100" : "bg-gray-100"
                )}>
                  {/* paypal wordmark-style icon */}
                  <span className={cn("text-sm font-extrabold italic", selectedGateway === "PAYPAL" ? "text-blue-600" : "text-gray-400")}>
                    PP
                  </span>
                </div>
                <div className="text-center">
                  <p className={cn("text-sm font-semibold", selectedGateway === "PAYPAL" ? "text-blue-700" : "text-gray-700")}>
                    PayPal
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Pay in USD</p>
                </div>
              </button>
            </div>
          </div>

          {/* khalti cta */}
          {selectedGateway === "KHALTI" && (
            <Button
              onClick={handleKhaltiInitiate}
              disabled={isInitiating}
              className="w-full h-10 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl gap-2"
            >
              {isInitiating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to Khalti...
                </>
              ) : (
                <>
                  Proceed to Khalti
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}

          {/* paypal inline buttons */}
          {selectedGateway === "PAYPAL" && (
            <PayPalScriptProvider
              options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
                currency: "USD",
                intent: "capture",
                components: "buttons",
              }}
            >
              <PayPalButtons
                style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 40 }}
                createOrder={createPaypalOrder}
                onApprove={capturePaypalOrder}
                onError={async (err: unknown) => {
                  void err;
                  // if createOrder failed, surface that specific message — no slot was held
                  if (createOrderErrorRef.current) {
                    setError(createOrderErrorRef.current);
                    createOrderErrorRef.current = null;
                    return;
                  }
                  // use ref — state is stale in sdk callbacks due to closure capture at render time
                  if (pendingAppointmentIdRef.current) await cancelPendingAndReset(pendingAppointmentIdRef.current);
                  setError("Payment failed. Your slot has been released. Click the PayPal button to try again.");
                }}
                onCancel={async () => {
                  if (pendingAppointmentIdRef.current) await cancelPendingAndReset(pendingAppointmentIdRef.current);
                  setError("Payment was cancelled. Click the PayPal button to try again.");
                }}
              />
            </PayPalScriptProvider>
          )}

          {/* error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* security note */}
          <div className="flex items-center gap-2 text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <p className="text-[11px]">Payments are secured by Khalti and PayPal. MindLens AI does not store your card details.</p>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
