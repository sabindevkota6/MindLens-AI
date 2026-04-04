import { NextRequest, NextResponse } from "next/server";
import { finalizeSuccessfulBooking, cancelPendingBooking } from "@/lib/actions/payment";

// khalti redirects the user's browser to this url after payment
// query params: pidx, purchase_order_id (= appointmentId), status, transaction_id, amount
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const pidx = params.get("pidx") ?? "";
  const appointmentId = params.get("purchase_order_id") ?? "";
  const status = params.get("status") ?? "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // handle user-cancelled or failed payments from khalti
  if (status === "Cancelled" || status === "Failed") {
    await cancelPendingBooking(appointmentId);
    return NextResponse.redirect(new URL("/dashboard/patient/payment/failed?reason=cancelled", appUrl));
  }

  if (!pidx || !appointmentId) {
    return NextResponse.redirect(new URL("/dashboard/patient/payment/failed?reason=invalid", appUrl));
  }

  // verify the payment with khalti lookup — never trust redirect params alone
  let lookupData: { pidx: string; status: string; transaction_id?: string } | null = null;
  try {
    const res = await fetch("https://dev.khalti.com/api/v2/epayment/lookup/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    if (!res.ok) throw new Error("Lookup API error");
    lookupData = await res.json();
  } catch (err) {
    console.error("Khalti lookup failed:", err);
    await cancelPendingBooking(appointmentId);
    return NextResponse.redirect(new URL("/dashboard/patient/payment/failed?reason=verification_failed", appUrl));
  }

  if (lookupData?.status !== "Completed") {
    await cancelPendingBooking(appointmentId);
    return NextResponse.redirect(new URL("/dashboard/patient/payment/failed?reason=verification_failed", appUrl));
  }

  // finalize the appointment
  const result = await finalizeSuccessfulBooking(appointmentId, lookupData.transaction_id ?? pidx);
  if ("error" in result) {
    console.error("Finalize failed:", result.error);
    return NextResponse.redirect(new URL("/dashboard/patient/payment/failed?reason=finalize_error", appUrl));
  }

  return NextResponse.redirect(new URL(`/dashboard/patient/payment/success?appointmentId=${appointmentId}`, appUrl));
}
