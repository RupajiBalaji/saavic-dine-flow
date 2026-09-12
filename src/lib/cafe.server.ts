/**
 * Server-only business logic for Saavic Healthy Café.
 * Never imported from client code (blocked by the *.server.ts convention).
 */
import { createHmac, timingSafeEqual, randomUUID } from "crypto";

export type TaxSettings = { name: string; percent: number; inclusive: boolean };
export type CafeSettings = {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  currency: string;
  opening_time: string;
  closing_time: string;
  ordering_enabled: boolean;
  enforce_hours: boolean;
};

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export async function getSettings() {
  const db = await admin();
  const { data } = await db.from("settings").select("key, value");
  const map = new Map((data ?? []).map((r) => [r.key, r.value as unknown]));
  const cafe = (map.get("cafe") ?? {}) as CafeSettings;
  const tax = (map.get("tax") ?? { name: "GST", percent: 5, inclusive: false }) as TaxSettings;
  return { cafe, tax };
}

/** Current time in Asia/Kolkata as HH:MM */
export function istTimeString(d = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function istDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d).replace(/-/g, "");
}

export async function assertOrderingOpen() {
  const { cafe } = await getSettings();
  if (cafe.ordering_enabled === false) {
    throw new Error("Online ordering is currently unavailable. Please ask our staff for help.");
  }
  if (cafe.enforce_hours) {
    const now = istTimeString();
    if (cafe.opening_time && cafe.closing_time) {
      if (now < cafe.opening_time || now >= cafe.closing_time) {
        throw new Error(
          `Saavic Healthy Café is currently closed. Opening at ${cafe.opening_time}.`,
        );
      }
    }
  }
}

/** Get (or create) the active session for a table, keyed by table slug. */
export async function getOrCreateSession(tableSlug: string, create: boolean) {
  const db = await admin();
  const { data: table, error: tErr } = await db
    .from("cafe_tables")
    .select("*")
    .eq("slug", tableSlug)
    .maybeSingle();
  if (tErr) throw new Error("Could not load this table.");
  if (!table) throw new Error("This table QR is not recognised.");
  if (!table.active) throw new Error("This table is currently unavailable. Please contact our staff.");

  const { data: existing } = await db
    .from("table_sessions")
    .select("*")
    .eq("table_id", table.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (existing) return { table, session: existing };
  if (!create) return { table, session: null };

  const dateKey = istDateKey();
  const { count } = await db
    .from("table_sessions")
    .select("id", { count: "exact", head: true })
    .like("code", `SAAVIC-${dateKey}-%`);
  const code = `SAAVIC-${dateKey}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: created, error } = await db
    .from("table_sessions")
    .insert({ table_id: table.id, code, token: randomUUID() })
    .select("*")
    .single();

  if (error) {
    // Race: another customer created the session first.
    const { data: raced } = await db
      .from("table_sessions")
      .select("*")
      .eq("table_id", table.id)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (raced) return { table, session: raced };
    throw new Error("Could not start a table session. Please try again.");
  }
  await db.from("cafe_tables").update({ status: "OCCUPIED" }).eq("id", table.id);
  return { table, session: created };
}

export async function loadSessionByToken(sessionId: string, token: string) {
  const db = await admin();
  const { data } = await db
    .from("table_sessions")
    .select("*, cafe_tables(*)")
    .eq("id", sessionId)
    .eq("token", token)
    .maybeSingle();
  if (!data) throw new Error("Your table session is no longer active. Please scan the table QR again.");
  return data;
}

export type BillLine = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
};

export async function computeBill(sessionId: string) {
  const db = await admin();
  const { tax } = await getSettings();
  const { data: session } = await db
    .from("table_sessions")
    .select("*, cafe_tables(name, slug)")
    .eq("id", sessionId)
    .single();
  const { data: orders } = await db
    .from("orders")
    .select("*, order_items(*)")
    .eq("session_id", sessionId)
    .order("created_at");

  const billable = (orders ?? []).filter((o) => o.status !== "CANCELLED");
  const subtotal = round2(billable.reduce((s, o) => s + Number(o.subtotal), 0));
  const discount = round2(Number(session?.discount_amount ?? 0));
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = tax.inclusive ? 0 : round2((taxable * Number(tax.percent)) / 100);
  const total = round2(taxable + taxAmount);

  const { data: payments } = await db
    .from("payments")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at");
  const paid = round2(
    (payments ?? [])
      .filter((p) => p.status === "SUCCESS")
      .reduce((s, p) => s + Number(p.amount), 0),
  );

  return {
    session,
    orders: orders ?? [],
    subtotal,
    discount,
    taxName: tax.name,
    taxPercent: Number(tax.percent),
    taxAmount,
    total,
    paid,
    due: round2(Math.max(0, total - paid)),
    payments: payments ?? [],
  };
}

export async function logAudit(entry: {
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  object_type?: string;
  object_id?: string;
  description?: string;
}) {
  const db = await admin();
  await db.from("audit_logs").insert(entry);
}

// ---------------- Razorpay ----------------
export function razorpayConfigured() {
  return Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]);
}

export async function razorpayCreateOrder(amountPaise: number, receipt: string) {
  const keyId = process.env["RAZORPAY_KEY_ID"]!;
  const keySecret = process.env["RAZORPAY_KEY_SECRET"]!;
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, payment_capture: 1 }),
  });
  if (!res.ok) {
    console.error("razorpay order failed", await res.text());
    throw new Error("Could not start the payment. Please try again.");
  }
  return (await res.json()) as { id: string; amount: number; currency: string };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
