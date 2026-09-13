import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "crypto";

/**
 * Razorpay webhook. Signature is verified against the raw body before anything is written.
 * Duplicate deliveries are idempotent: a payment already marked SUCCESS is left untouched.
 */
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        if (signature.length !== expected.length || signature !== expected) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event?: string;
          payload?: { payment?: { entity?: Record<string, unknown> } };
        };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const entity = event.payload?.payment?.entity as
          | { id?: string; order_id?: string; method?: string; amount?: number }
          | undefined;
        if (!entity?.order_id) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("razorpay_order_id", entity.order_id)
          .maybeSingle();
        if (!payment) return new Response("ok");

        const isCaptured = event.event === "payment.captured" || event.event === "order.paid";
        const isFailed = event.event === "payment.failed";

        if (isCaptured && payment.status !== "SUCCESS") {
          await supabaseAdmin
            .from("payments")
            .update({
              status: "SUCCESS",
              razorpay_payment_id: entity.id ?? payment.razorpay_payment_id,
              method: entity.method ?? "RAZORPAY",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          const { computeBill } = await import("@/lib/cafe.server");
          const bill = await computeBill(payment.session_id);
          await supabaseAdmin
            .from("table_sessions")
            .update({ payment_state: bill.due <= 0 ? "PAID" : "PAYMENT_PENDING" })
            .eq("id", payment.session_id);
          if (bill.due <= 0) {
            await supabaseAdmin.from("cafe_tables").update({ status: "PAID" }).eq("id", payment.table_id);
          }
          await supabaseAdmin.from("audit_logs").insert({
            action: "PAYMENT_WEBHOOK_SUCCESS",
            object_type: "payment",
            object_id: payment.id,
            description: `Razorpay webhook confirmed ${entity.id}`,
          });
        } else if (isFailed && payment.status === "PENDING") {
          await supabaseAdmin
            .from("payments")
            .update({ status: "FAILED", updated_at: new Date().toISOString() })
            .eq("id", payment.id);
          await supabaseAdmin
            .from("table_sessions")
            .update({ payment_state: "UNPAID" })
            .eq("id", payment.session_id);
        }

        return new Response("ok");
      },
    },
  },
});
