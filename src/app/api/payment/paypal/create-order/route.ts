import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPendingBooking, cancelPendingBooking } from "@/lib/actions/payment";

async function getPaypalAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Failed to get PayPal access token");
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

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
  const pending = await createPendingBooking(slotId, "PAYPAL", medicalConcern, emotionLogId);
  if ("error" in pending) {
    return NextResponse.json({ error: pending.error }, { status: 400 });
  }

  const { appointmentId, amountUsd } = pending;

  try {
    const accessToken = await getPaypalAccessToken();

    const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: appointmentId,
            amount: {
              currency_code: "USD",
              value: String(amountUsd.toFixed(2)),
            },
            description: "MindLens AI Counseling Session",
          },
        ],
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error("PayPal create-order error:", errText);
      throw new Error("PayPal order creation failed");
    }

    const order = await orderRes.json() as { id: string };

    // store the paypal order id for later capture verification
    await prisma.payment.update({
      where: { appointmentId },
      data: { gatewayOrderId: order.id },
    });

    return NextResponse.json({ orderId: order.id, appointmentId });
  } catch (err) {
    console.error("PayPal create-order failed:", err);
    await cancelPendingBooking(appointmentId);
    return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
  }
}
