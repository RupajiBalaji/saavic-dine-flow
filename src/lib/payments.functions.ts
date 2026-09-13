import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const sessionAuth = z.object({ sessionId: z.string().uuid(), sessionToken: z.string().min(8) });

/** Creates (or reuses) a Razorpay order for the whole table bill. Amount is computed server-side. */
export const createBillPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionAuth.extend({ idempotencyKey: z.string().min(8).max(80) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin, loadSessionByToken, computeBill, razorpayConfigured, razorpayCreateOrder } =
      await import("./cafe.server");
    const session = await loadSessionByToken(data.sessionId, data.sessionToken);
    const db = await admin();
    const bill = await computeBill(session.id);
    if (bill.due <= 0) return { alreadyPaid: true as const };

    if (!razorpayConfigured()) {
      return {
        demoMode: true as const,
        amount: bill.due,
        message:
          "Online payment is not configured yet. Please pay at the counter — our staff can record your payment.",
      };
    }

    const { data: existing } = await db
      .from("payments")
      .select("*")
      .eq("idempotency_key", data.idempotencyKey)
      .maybeSingle();
    if (existing && existing.status === "PENDING" && existing.razorpay_order_id) {
      return {
        demoMode: false as const,
        alreadyPaid: false as const,
        keyId: process.env["RAZORPAY_KEY_ID"]!,
        razorpayOrderId: existing.razorpay_order_id,
        amount: Number(existing.amount),
        paymentId: existing.id,
      };
    }

    const rzp = await razorpayCreateOrder(Math.round(bill.due * 100), session.code.slice(0, 40));
    const { data: payment, error } = await db
      .from("payments")
      .insert({
        session_id: session.id,
        table_id: session.table_id,
        amount: bill.due,
        razorpay_order_id: rzp.id,
        idempotency_key: data.idempotencyKey,
        status: "PENDING",
      })
      .select("*")
      .single();
    if (error || !payment) throw new Error("Could not start the payment. Please try again.");

    await db.from("table_sessions").update({ payment_state: "PAYMENT_PENDING" }).eq("id", session.id);
    return {
      demoMode: false as const,
      alreadyPaid: false as const,
      keyId: process.env["RAZORPAY_KEY_ID"]!,
      razorpayOrderId: rzp.id,
      amount: bill.due,
      paymentId: payment.id,
    };
  });

/** Server-side signature verification. The browser response alone is never trusted. */
export const verifyBillPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionAuth
      .extend({
        razorpay_order_id: z.string().min(4),
        razorpay_payment_id: z.string().min(4),
        razorpay_signature: z.string().min(10),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { admin, loadSessionByToken, verifyRazorpaySignature, computeBill, logAudit } = await import(
      "./cafe.server"
    );
    const session = await loadSessionByToken(data.sessionId, data.sessionToken);
    const db = await admin();

    const ok = verifyRazorpaySignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature,
    );
    if (!ok) {
      await db
        .from("payments")
        .update({ status: "FAILED", updated_at: new Date().toISOString() })
        .eq("razorpay_order_id", data.razorpay_order_id)
        .eq("session_id", session.id);
      throw new Error("We could not verify this payment. Your order is still active.");
    }

    const { data: payment } = await db
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .eq("session_id", session.id)
      .maybeSingle();
    if (!payment) throw new Error("Payment record not found.");

    if (payment.status !== "SUCCESS") {
      await db
        .from("payments")
        .update({
          status: "SUCCESS",
          razorpay_payment_id: data.razorpay_payment_id,
          method: "RAZORPAY",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
      await logAudit({
        action: "PAYMENT_SUCCESS",
        object_type: "payment",
        object_id: payment.id,
        description: `Razorpay payment ${data.razorpay_payment_id} for ${session.code}`,
      });
    }

    const bill = await computeBill(session.id);
    await db
      .from("table_sessions")
      .update({ payment_state: bill.due <= 0 ? "PAID" : "PAYMENT_PENDING" })
      .eq("id", session.id);
    if (bill.due <= 0) await db.from("cafe_tables").update({ status: "PAID" }).eq("id", session.table_id);

    return {
      ok: true,
      paymentId: data.razorpay_payment_id,
      amount: Number(payment.amount),
      due: bill.due,
    };
  });

export const markPaymentFailed = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sessionAuth.extend({ razorpay_order_id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { admin, loadSessionByToken } = await import("./cafe.server");
    const session = await loadSessionByToken(data.sessionId, data.sessionToken);
    const db = await admin();
    await db
      .from("payments")
      .update({ status: "FAILED", updated_at: new Date().toISOString() })
      .eq("razorpay_order_id", data.razorpay_order_id)
      .eq("session_id", session.id)
      .eq("status", "PENDING");
    await db.from("table_sessions").update({ payment_state: "UNPAID" }).eq("id", session.id);
    return { ok: true };
  });
