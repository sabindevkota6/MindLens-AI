import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { finalizeSuccessfulBooking, cancelPendingBooking } from "@/lib/actions/payment";

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

  const body = await request.json() as { orderId: string; appointmentId: string };
  const { orderId, appointmentId } = body;

  if (!orderId || !appointmentId) {
    return NextResponse.json({ error: "orderId and appointmentId are required" }, { status: 400 });
  }

  // verify the appointment belongs to the requesting patient
  const payment = await prisma.payment.findFirst({
    where: { gatewayOrderId: orderId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  const apptOwner = await prisma.appointment.findUnique({
    where: { id: payment.appointmentId },
    include: { patient: { select: { userId: true } } },
  });

  if (!apptOwner || apptOwner.patient.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const accessToken = await getPaypalAccessToken();

    const captureRes = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!captureRes.ok) {
      const errText = await captureRes.text();
      console.error("PayPal capture error:", errText);
      throw new Error("PayPal capture failed");
    }

    const capture = await captureRes.json() as {
      status: string;
      purchase_units: { payments: { captures: { id: string }[] } }[];
    };

    if (capture.status !== "COMPLETED") {
      await cancelPendingBooking(appointmentId);
      return NextResponse.json({ error: "Payment was not approved" }, { status: 402 });
    }

    const txnId = capture.purchase_units[0]?.payments?.captures[0]?.id ?? orderId;

    const result = await finalizeSuccessfulBooking(appointmentId, txnId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointmentId });
  } catch (err) {
    console.error("PayPal capture failed:", err);
    await cancelPendingBooking(appointmentId);
    return NextResponse.json({ error: "Payment capture failed. Please try again." }, { status: 502 });
  }
}
