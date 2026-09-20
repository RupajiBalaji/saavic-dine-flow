import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().max(200).optional(),
  modifiers: z
    .array(z.object({ optionId: z.string().uuid() }))
    .max(10)
    .optional(),
});

const placeOrderSchema = z.object({
  tableSlug: z.string().min(1).max(60),
  sessionId: z.string().uuid().optional(),
  sessionToken: z.string().max(80).optional(),
  idempotencyKey: z.string().min(8).max(80),
  notes: z.string().max(300).optional(),
  customerName: z.string().max(80).optional(),
  customerPhone: z.string().max(20).optional(),
  items: z.array(cartItemSchema).min(1).max(30),
});

/** Public menu + café settings. No auth. */
export const getMenu = createServerFn({ method: "GET" }).handler(async () => {
  const { admin, getSettings } = await import("./cafe.server");
  const db = await admin();
  const [{ data: categories }, { data: products }, { data: modifiers }, { data: options }, { data: links }] =
    await Promise.all([
      db.from("categories").select("*").eq("active", true).order("sort_order"),
      db.from("products").select("*").neq("status", "HIDDEN").order("sort_order"),
      db.from("modifiers").select("*").order("sort_order"),
      db.from("modifier_options").select("*").order("sort_order"),
      db.from("product_modifiers").select("*"),
    ]);
  const settings = await getSettings();
  return {
    categories: categories ?? [],
    products: products ?? [],
    modifiers: modifiers ?? [],
    options: options ?? [],
    links: links ?? [],
    cafe: settings.cafe,
    tax: settings.tax,
  };
});

/** Resolve a table QR slug into the active session (creating none until an order is placed). */
export const getTableContext = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const { getOrCreateSession } = await import("./cafe.server");
    const { table, session } = await getOrCreateSession(data.slug, false);
    return {
      table: { id: table.id, name: table.name, slug: table.slug, status: table.status },
      session: session
        ? { id: session.id, code: session.code, token: session.token, payment_state: session.payment_state }
        : null,
    };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => placeOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const { admin, assertOrderingOpen, getOrCreateSession, getSettings, round2 } = await import(
      "./cafe.server"
    );
    await assertOrderingOpen();
    const db = await admin();

    // Idempotency: return the existing order for a repeated request.
    const { data: existing } = await db
      .from("orders")
      .select("id, order_number, session_id")
      .eq("idempotency_key", data.idempotencyKey)
      .maybeSingle();
    if (existing) return { orderId: existing.id, orderNumber: existing.order_number, sessionId: existing.session_id, duplicate: true };

    const { table, session } = await getOrCreateSession(data.tableSlug, true);
    if (!session) throw new Error("Could not open a session for this table.");
    if (data.sessionId && data.sessionId !== session.id) {
      // The table was closed and reopened while the page was open.
      throw new Error("This table was closed by staff. Your cart now belongs to a fresh session.");
    }

    // Server-side pricing — frontend prices are never trusted.
    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products } = await db.from("products").select("*").in("id", ids);
    const optionIds = data.items.flatMap((i) => (i.modifiers ?? []).map((m) => m.optionId));
    const { data: options } = optionIds.length
      ? await db.from("modifier_options").select("*").in("id", [...new Set(optionIds)])
      : { data: [] as { id: string; name: string; price_delta: number }[] };

    const rows: {
      product_id: string;
      product_name: string;
      unit_price: number;
      quantity: number;
      line_total: number;
      notes: string | null;
      modifiers: { name: string; price_delta: number }[];
    }[] = [];

    for (const item of data.items) {
      const p = (products ?? []).find((x) => x.id === item.productId);
      if (!p) throw new Error("An item in your cart is no longer on the menu.");
      if (p.status !== "AVAILABLE") throw new Error(`${p.name} is currently unavailable.`);
      const mods = (item.modifiers ?? [])
        .map((m) => (options ?? []).find((o) => o.id === m.optionId))
        .filter(Boolean)
        .map((o) => ({ name: o!.name, price_delta: Number(o!.price_delta) }));
      const unit = round2(Number(p.price) + mods.reduce((s, m) => s + m.price_delta, 0));
      rows.push({
        product_id: p.id,
        product_name: p.name,
        unit_price: unit,
        quantity: item.quantity,
        line_total: round2(unit * item.quantity),
        notes: item.notes?.trim() ? item.notes.trim().slice(0, 200) : null,
        modifiers: mods,
      });
    }

    const subtotal = round2(rows.reduce((s, r) => s + r.line_total, 0));
    const { tax } = await getSettings();
    const taxAmount = tax.inclusive ? 0 : round2((subtotal * Number(tax.percent)) / 100);

    const { data: seq } = await db.rpc("next_order_number");
    const orderNumber = String(seq);

    const { data: order, error } = await db
      .from("orders")
      .insert({
        order_number: orderNumber,
        session_id: session.id,
        table_id: table.id,
        subtotal,
        tax_amount: taxAmount,
        total: round2(subtotal + taxAmount),
        notes: data.notes?.trim()?.slice(0, 300) || null,
        customer_name: data.customerName?.trim()?.slice(0, 80) || null,
        customer_phone: data.customerPhone?.trim()?.slice(0, 20) || null,
        idempotency_key: data.idempotencyKey,
      })
      .select("*")
      .single();

    if (error || !order) {
      const { data: raced } = await db
        .from("orders")
        .select("id, order_number, session_id")
        .eq("idempotency_key", data.idempotencyKey)
        .maybeSingle();
      if (raced) return { orderId: raced.id, orderNumber: raced.order_number, sessionId: raced.session_id, duplicate: true };
      console.error(error);
      throw new Error("We could not place your order. Please try again.");
    }

    await db.from("order_items").insert(rows.map((r) => ({ ...r, order_id: order.id })));
    await db.from("cafe_tables").update({ status: "ORDERING" }).eq("id", table.id);

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      sessionId: session.id,
      sessionToken: session.token,
      duplicate: false,
    };
  });

const sessionAuth = z.object({ sessionId: z.string().uuid(), sessionToken: z.string().min(8) });

/** Live orders + bill for the customer's own table session. */
export const getSessionState = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => sessionAuth.parse(d))
  .handler(async ({ data }) => {
    const { loadSessionByToken, computeBill } = await import("./cafe.server");
    const session = await loadSessionByToken(data.sessionId, data.sessionToken);
    const bill = await computeBill(session.id);
    return {
      session: {
        id: session.id,
        code: session.code,
        status: session.status,
        payment_state: session.payment_state,
        table: session.cafe_tables,
      },
      orders: bill.orders.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        total: Number(o.total),
        created_at: o.created_at,
        items: (o.order_items ?? []).map((i) => ({
          id: i.id,
          name: i.product_name,
          quantity: i.quantity,
          line_total: Number(i.line_total),
        })),
      })),
      bill: {
        subtotal: bill.subtotal,
        discount: bill.discount,
        taxName: bill.taxName,
        taxPercent: bill.taxPercent,
        taxAmount: bill.taxAmount,
        total: bill.total,
        paid: bill.paid,
        due: bill.due,
        payments: (bill.payments ?? [])
          .filter((p) => p.status === "SUCCESS")
          .map((p) => ({
            id: p.id,
            transactionId: p.razorpay_payment_id || p.id,
            amount: Number(p.amount),
            paidAt: p.created_at,
            provider: p.provider,
            method: p.method || p.provider,
          })),
      },
    };
  });

export const requestCancelOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sessionAuth.extend({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { admin, loadSessionByToken, logAudit } = await import("./cafe.server");
    await loadSessionByToken(data.sessionId, data.sessionToken);
    const db = await admin();
    const { data: order } = await db
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .eq("session_id", data.sessionId)
      .maybeSingle();
    if (!order) throw new Error("Order not found for your table.");
    if (order.status !== "PLACED")
      throw new Error("This order is already being prepared — please speak to our staff.");
    await db
      .from("orders")
      .update({ status: "CANCELLED", cancel_reason: "Customer request", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    await logAudit({
      action: "ORDER_CANCELLED",
      object_type: "order",
      object_id: order.id,
      description: `Customer cancelled ${order.order_number}`,
    });
    return { ok: true };
  });

export const applyCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sessionAuth.extend({ code: z.string().min(2).max(30) }).parse(d))
  .handler(async ({ data }) => {
    const { admin, loadSessionByToken, computeBill, round2 } = await import("./cafe.server");
    await loadSessionByToken(data.sessionId, data.sessionToken);
    const db = await admin();
    const code = data.code.trim().toUpperCase();
    const { data: d } = await db.from("discounts").select("*").eq("code", code).maybeSingle();
    const now = new Date();
    if (
      !d ||
      !d.active ||
      (d.starts_at && new Date(d.starts_at) > now) ||
      (d.ends_at && new Date(d.ends_at) < now) ||
      (d.usage_limit != null && d.used_count >= d.usage_limit)
    ) {
      throw new Error("That coupon code isn't valid right now.");
    }
    const bill = await computeBill(data.sessionId);
    if (bill.subtotal < Number(d.min_order))
      throw new Error(`This coupon needs a minimum order of ₹${Number(d.min_order)}.`);
    const amount =
      d.type === "PERCENT" ? round2((bill.subtotal * Number(d.value)) / 100) : round2(Number(d.value));
    const capped = Math.min(amount, bill.subtotal);
    await db
      .from("table_sessions")
      .update({ discount_code: code, discount_amount: capped })
      .eq("id", data.sessionId);
    return { discount: capped };
  });

export const getPublicTables = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { admin } = await import("./cafe.server");
    const db = await admin();
    const [{ data: tables, error: tErr }, { data: activeSessions }] = await Promise.all([
      db
        .from("cafe_tables")
        .select("id, name, slug, capacity, status, active, sort_order")
        .eq("active", true)
        .order("sort_order"),
      db
        .from("table_sessions")
        .select("id, table_id, status")
        .eq("status", "ACTIVE"),
    ]);

    if (tErr) {
      console.error("Error fetching tables:", tErr);
    }

    const activeTableIdSet = new Set((activeSessions ?? []).map((s) => s.table_id));

    if (tables && tables.length > 0) {
      return tables.map((t) => {
        const isFilled = activeTableIdSet.has(t.id) || t.status === "OCCUPIED";
        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          capacity: t.capacity ?? 4,
          active: t.active,
          isOccupied: isFilled,
          status: isFilled ? ("OCCUPIED" as const) : ("AVAILABLE" as const),
        };
      });
    }

    // Fallback if no tables in DB
    return Array.from({ length: 20 }, (_, i) => {
      const num = i + 1;
      const str = num < 10 ? `0${num}` : `${num}`;
      return {
        id: `t-${num}`,
        name: `Table ${str}`,
        slug: `table-${str}`,
        capacity: 4,
        active: true,
        isOccupied: false,
        status: "AVAILABLE" as const,
      };
    });
  } catch (err) {
    console.error("Failed to query public tables:", err);
    return Array.from({ length: 20 }, (_, i) => {
      const num = i + 1;
      const str = num < 10 ? `0${num}` : `${num}`;
      return {
        id: `t-${num}`,
        name: `Table ${str}`,
        slug: `table-${str}`,
        capacity: 4,
        active: true,
        isOccupied: false,
        status: "AVAILABLE" as const,
      };
    });
  }
});


