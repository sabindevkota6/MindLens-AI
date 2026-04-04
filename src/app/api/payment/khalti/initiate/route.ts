import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPendingBooking, cancelPendingBooking } from "@/lib/actions/payment";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { slotId: string; medicalConcern?: string; emotionLogId?: string };
  const { slotId, medicalConcern, emotionLogId } = body;

  if (!slotId) {
    return NextResponse.json({ error: "slotId is required" }, { status: 400 });
  }

  // create a pending appointment and hold the slot
  const pending = await createPendingBooking(slotId, "KHALTI", medicalConcern, emotionLogId);
  if ("error" in pending) {
    return NextResponse.json({ error: pending.error }, { status: 400 });
  }

  const { appointmentId, amountNpr } = pending;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // call Khalti v2 initiate API
  let khaltiResponse: { pidx: string; payment_url: string };
  try {
    const res = await fetch("https://dev.khalti.com/api/v2/epayment/initiate/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        return_url: `${appUrl}/api/payment/khalti/verify`,
        website_url: appUrl,
        amount: amountNpr * 100, // khalti expects paisa (1 NPR = 100 paisa)
        purchase_order_id: appointmentId,
        purchase_order_name: "MindLens AI Counseling Session",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Khalti initiate error:", errText);
      throw new Error("Khalti API error");
    }

    khaltiResponse = await res.json();
  } catch (err) {
    console.error("Khalti initiate failed:", err);
    await cancelPendingBooking(appointmentId);
    return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
  }

  // store the pidx so we can verify it later
  await prisma.payment.update({
    where: { appointmentId },
    data: { gatewayPidx: khaltiResponse.pidx },
  });

  return NextResponse.json({ payment_url: khaltiResponse.payment_url });
}
