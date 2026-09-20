import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Ctx = { supabase: { rpc: (fn: string, args: unknown) => Promise<{ data: unknown }> }; userId: string; claims: Record<string, unknown> };

type Role = "SUPER_ADMIN" | "MANAGER" | "KITCHEN_STAFF";

async function staff(context: unknown, allowed?: Role[]) {
  const ctx = context as Ctx & { supabase: { from: (t: string) => any } };
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = ((data ?? []) as { role: Role }[]).map((r) => r.role);
  if (roles.length === 0) throw new Error("Your account does not have staff access.");
  if (allowed && !roles.some((r) => allowed.includes(r) || r === "SUPER_ADMIN")) {
    throw new Error("You do not have permission for this action.");
  }
  return { roles, userId: ctx.userId, email: (ctx.claims?.["email"] as string) ?? null };
}

export const getMyStaffProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await staff(context);
    return me;
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await staff(context);
    const { admin, round2 } = await import("./cafe.server");
    const db = await admin();
    const startOfDayIST = new Date();
    startOfDayIST.setUTCHours(-5, -30, 0, 0); // 00:00 IST today in UTC

    const [{ data: orders }, { data: tables }, { data: sessions }, { data: payments }, { data: inv }] =
      await Promise.all([
        db.from("orders").select("*").gte("created_at", startOfDayIST.toISOString()),
        db.from("cafe_tables").select("*").order("sort_order"),
        db.from("table_sessions").select("*").eq("status", "ACTIVE"),
        db.from("payments").select("*").gte("created_at", startOfDayIST.toISOString()),
        db.from("inventory_items").select("*"),
      ]);

    const todayOrders = (orders ?? []).filter((o) => o.status !== "CANCELLED");
    const sales = round2(
      (payments ?? []).filter((p) => p.status === "SUCCESS").reduce((s, p) => s + Number(p.amount), 0),
    );
    const pendingOrders = todayOrders.filter((o) =>
      ["PLACED", "ACCEPTED", "PREPARING"].includes(o.status),
    ).length;
    const pendingPayments = (sessions ?? []).filter((s) => s.payment_state !== "PAID" && s.payment_state !== "CASH_PAID").length;
    const lowStock = (inv ?? []).filter((i) => Number(i.stock) <= Number(i.min_stock));

    return {
      sales,
      orderCount: todayOrders.length,
      activeTables: (sessions ?? []).length,
      totalTables: (tables ?? []).length,
      pendingOrders,
      pendingPayments,
      lowStock: lowStock.map((i) => ({
        id: i.id,
        name: i.name,
        stock: Number(i.stock),
        min_stock: Number(i.min_stock),
        unit: i.unit,
        critical: Number(i.stock) < Number(i.min_stock),
      })),
      revenueByHour: Object.entries(
        todayOrders.reduce<Record<string, number>>((acc, o) => {
          const h = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            hour12: false,
          }).format(new Date(o.created_at));
          acc[h] = round2((acc[h] ?? 0) + Number(o.total));
          return acc;
        }, {}),
      )
        .map(([hour, total]) => ({ hour: `${hour}:00`, total }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
    };
  });

export const getTableMap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await staff(context);
    const { admin, round2 } = await import("./cafe.server");
    const db = await admin();
    const { data: tables } = await db.from("cafe_tables").select("*").order("sort_order");
    const { data: sessions } = await db.from("table_sessions").select("*").eq("status", "ACTIVE");
    const ids = (sessions ?? []).map((s) => s.id);
    const { data: orders } = ids.length
      ? await db.from("orders").select("id, session_id, total, status").in("session_id", ids)
      : { data: [] as { id: string; session_id: string; total: number; status: string }[] };

    return (tables ?? []).map((t) => {
      const session = (sessions ?? []).find((s) => s.table_id === t.id) ?? null;
      const so = (orders ?? []).filter((o) => o.session_id === session?.id && o.status !== "CANCELLED");
      return {
        ...t,
        session: session
          ? { id: session.id, code: session.code, payment_state: session.payment_state, opened_at: session.opened_at }
          : null,
        orderCount: so.length,
        amount: round2(so.reduce((s, o) => s + Number(o.total), 0)),
      };
    });
  });

export const getTableDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tableId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await staff(context);
    const { admin, computeBill } = await import("./cafe.server");
    const db = await admin();
    const { data: table } = await db.from("cafe_tables").select("*").eq("id", data.tableId).single();
    const { data: session } = await db
      .from("table_sessions")
      .select("*")
      .eq("table_id", data.tableId)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (!session) return { table, session: null, bill: null };
    const bill = await computeBill(session.id);
    return { table, session, bill };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        search: z.string().max(60).optional(),
        status: z.string().max(20).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await staff(context);
    const { admin } = await import("./cafe.server");
    const db = await admin();
    let q = db
      .from("orders")
      .select("*, order_items(*), cafe_tables(name, slug), table_sessions(code, payment_state)")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status && data.status !== "ALL") q = q.eq("status", data.status as any);
    if (data.search) q = q.ilike("order_number", `%${data.search}%`);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: orders, error } = await q;
    if (error) throw new Error("Could not load orders.");
    return orders ?? [];
  });

export const getKitchenOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await staff(context);
    const { admin } = await import("./cafe.server");
    const db = await admin();
    const { data: rawOrders } = await db
      .from("orders")
      .select("*, order_items(*), cafe_tables(name), table_sessions(code, payment_state)")
      .in("status", ["PLACED", "ACCEPTED", "PREPARING", "READY"])
      .order("created_at");

    const orders = rawOrders ?? [];
    const now = Date.now();
    const updates: Promise<any>[] = [];

    for (const order of orders) {
      const elapsedMs = now - new Date(order.created_at).getTime();
      // Auto-progress PLACED to ACCEPTED after 5 seconds
      if (order.status === "PLACED" && elapsedMs >= 5000) {
        order.status = "ACCEPTED";
        updates.push(
          db
            .from("orders")
            .update({
              status: "ACCEPTED",
              accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id),
        );
      }
      // Auto-progress ACCEPTED to PREPARING after 3.5 minutes (210s)
      if (order.status === "ACCEPTED" && elapsedMs >= 210000) {
        order.status = "PREPARING";
        updates.push(
          db
            .from("orders")
            .update({
              status: "PREPARING",
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id),
          db.from("cafe_tables").update({ status: "FOOD_PREPARING" }).eq("id", order.table_id),
        );
      }
    }

    if (updates.length > 0) {
      await Promise.allSettled(updates);
    }

    return orders;
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum(["PLACED", "ACCEPTED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"]),
        reason: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER", "KITCHEN_STAFF"]);
    const { admin, logAudit } = await import("./cafe.server");
    const db = await admin();
    if (data.status === "CANCELLED" && !data.reason?.trim())
      throw new Error("A cancellation reason is required.");

    const patch: {
      status: "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
      updated_at: string;
      accepted_at?: string | null;
      ready_at?: string | null;
      served_at?: string | null;
      cancel_reason?: string | null;
    } = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.status === "ACCEPTED") patch.accepted_at = new Date().toISOString();
    if (data.status === "READY") patch.ready_at = new Date().toISOString();
    if (data.status === "SERVED") patch.served_at = new Date().toISOString();
    if (data.status === "CANCELLED") patch.cancel_reason = data.reason?.trim() ?? null;

    const { data: order, error } = await db
      .from("orders")
      .update(patch)
      .eq("id", data.orderId)
      .select("*, table_sessions(payment_state)")
      .single();
    if (error || !order) throw new Error("Could not update this order.");

    if (data.status === "CANCELLED" && order.table_sessions?.payment_state === "PAID") {
      await db.from("table_sessions").update({ payment_state: "REFUND_REQUIRED" }).eq("id", order.session_id);
    }
    const tableStatus =
      data.status === "PREPARING" ? "FOOD_PREPARING" : data.status === "READY" ? "READY" : null;
    if (tableStatus) await db.from("cafe_tables").update({ status: tableStatus }).eq("id", order.table_id);

    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: "ORDER_STATUS_CHANGED",
      object_type: "order",
      object_id: order.id,
      description: `${order.order_number} → ${data.status}${data.reason ? ` (${data.reason})` : ""}`,
    });
    return { ok: true };
  });

export const markCashPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        method: z.enum(["CASH", "UPI", "CARD"]).optional(),
        referenceNumber: z.string().max(80).optional(),
        notes: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER"]);
    const { admin, computeBill, logAudit } = await import("./cafe.server");
    const db = await admin();
    const bill = await computeBill(data.sessionId);
    if (bill.due <= 0) return { ok: true, alreadyPaid: true };

    const method = data.method ?? "CASH";
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const txnId = data.referenceNumber?.trim() || `TXN-${method}-${dateStr}-${randomSuffix}`;
    const paidAt = now.toISOString();

    const { error: pErr } = await db.from("payments").insert({
      session_id: data.sessionId,
      table_id: bill.session!.table_id,
      provider: method,
      amount: bill.due,
      status: "SUCCESS",
      method: method,
      razorpay_payment_id: txnId,
      recorded_by: me.userId,
      notes: data.notes?.trim() || `${method} recorded by ${me.email ?? me.userId} (Txn: ${txnId})`,
    });
    if (pErr) throw new Error(pErr.message);

    await db.from("table_sessions").update({ payment_state: "CASH_PAID" }).eq("id", data.sessionId);
    await db.from("cafe_tables").update({ status: "PAID" }).eq("id", bill.session!.table_id);

    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: "PAYMENT_RECORDED",
      object_type: "payment",
      object_id: txnId,
      description: `${method} payment of ₹${bill.due} recorded for table session ${bill.session!.code}. Txn ID: ${txnId}`,
    });

    return { ok: true, amount: bill.due, transactionId: txnId, paidAt, method };
  });

export const closeTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER"]);
    const { admin, computeBill, logAudit } = await import("./cafe.server");
    const db = await admin();
    const bill = await computeBill(data.sessionId);
    if (!bill.session || bill.session.status !== "ACTIVE") throw new Error("This session is already closed.");

    const openOrders = bill.orders.filter(
      (o) => !["SERVED", "COMPLETED", "CANCELLED"].includes(o.status),
    );
    if (openOrders.length > 0)
      throw new Error("Some orders are still in progress. Mark them served before closing.");
    if (bill.due > 0) throw new Error("Payment is still pending. Record the payment before closing.");

    await db
      .from("table_sessions")
      .update({ status: "CLOSED", closed_at: new Date().toISOString(), closed_by: me.userId })
      .eq("id", data.sessionId);
    await db
      .from("orders")
      .update({ status: "COMPLETED" })
      .eq("session_id", data.sessionId)
      .eq("status", "SERVED");
    await db.from("cafe_tables").update({ status: "AVAILABLE" }).eq("id", bill.session.table_id);
    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: "TABLE_CLOSED",
      object_type: "session",
      object_id: data.sessionId,
      description: `Closed ${bill.session.code}, bill ₹${bill.total}`,
    });
    return { ok: true };
  });

// ---------- Menu management ----------
const productSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  ingredients: z.string().max(500).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  price: z.number().min(0).max(100000),
  status: z.enum(["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"]),
  prep_minutes: z.number().int().min(0).max(240).optional(),
  calories: z.number().int().min(0).max(5000).nullable().optional(),
  protein_g: z.number().min(0).max(500).nullable().optional(),
  carbs_g: z.number().min(0).max(500).nullable().optional(),
  fats_g: z.number().min(0).max(500).nullable().optional(),
  allergens: z.string().max(300).nullable().optional(),
});

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER"]);
    const { admin, logAudit } = await import("./cafe.server");
    const db = await admin();
    const { id, ...rest } = data;
    const payload = {
      name: data.name,
      slug: data.slug,
      price: data.price,
      status: data.status,
      category_id: data.category_id ?? null,
      description: data.description ?? null,
      ingredients: data.ingredients ?? null,
      image_url: data.image_url ?? null,
      prep_minutes: data.prep_minutes ?? 15,
      calories: data.calories ?? null,
      protein_g: data.protein_g ?? null,
      carbs_g: data.carbs_g ?? null,
      fats_g: data.fats_g ?? null,
      allergens: data.allergens ?? null,
    };
    const { error } = id
      ? await db.from("products").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id)
      : await db.from("products").insert(payload);
    if (error) throw new Error(error.message);
    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: id ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
      object_type: "product",
      object_id: id ?? data.slug,
      description: `${data.name} @ ₹${data.price} (${data.status})`,
    });
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER"]);
    const { admin, logAudit } = await import("./cafe.server");
    const db = await admin();
    await db.from("products").update({ status: "HIDDEN" }).eq("id", data.id);
    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: "PRODUCT_HIDDEN",
      object_type: "product",
      object_id: data.id,
    });
    return { ok: true };
  });

export const setProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER", "KITCHEN_STAFF"]);
    const { admin, logAudit } = await import("./cafe.server");
    const db = await admin();
    const { error } = await db
      .from("products")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: `PRODUCT_STATUS_${data.status}`,
      object_type: "product",
      object_id: data.id,
      description: `Dish status set to ${data.status}`,
    });
    return { ok: true, status: data.status };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(80),
        slug: z.string().min(1).max(80),
        sort_order: z.number().int().min(0).max(999),
        active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await staff(context, ["MANAGER"]);
    const { admin } = await import("./cafe.server");
    const db = await admin();
    const { id, ...payload } = data;
    const { error } = id
      ? await db.from("categories").update(payload).eq("id", id)
      : await db.from("categories").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Tables ----------
export const saveTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(40),
        slug: z
          .string()
          .min(1)
          .max(40)
          .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
        capacity: z.number().int().min(1).max(40),
        active: z.boolean(),
        sort_order: z.number().int().min(0).max(999),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await staff(context, ["MANAGER"]);
    const { admin } = await import("./cafe.server");
    const db = await admin();
    const { id, ...payload } = data;
    const { error } = id
      ? await db.from("cafe_tables").update(payload).eq("id", id)
      : await db.from("cafe_tables").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Settings / discounts / inventory / reports / audit ----------
export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await staff(context, ["SUPER_ADMIN"]);
    const { getSettings } = await import("./cafe.server");
    return await getSettings();
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        cafe: z.object({
          name: z.string().max(80),
          tagline: z.string().max(120),
          phone: z.string().max(30),
          whatsapp: z.string().max(30),
          address: z.string().max(200),
          currency: z.string().max(10),
          opening_time: z.string().max(5),
          closing_time: z.string().max(5),
          ordering_enabled: z.boolean(),
          enforce_hours: z.boolean(),
          gstin: z.string().max(30).optional().default(""),
          fssai: z.string().max(30).optional().default(""),
          sac_code: z.string().max(20).optional().default("996331"),
        }),
        tax: z.object({
          name: z.string().max(30),
          percent: z.number().min(0).max(50),
          inclusive: z.boolean(),
        }),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["SUPER_ADMIN"]);
    const { admin, logAudit } = await import("./cafe.server");
    const db = await admin();
    await db.from("settings").upsert([
      { key: "cafe", value: data.cafe, updated_at: new Date().toISOString() },
      { key: "tax", value: data.tax, updated_at: new Date().toISOString() },
    ]);
    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: "SETTINGS_UPDATED",
      object_type: "settings",
      description: `Tax ${data.tax.name} ${data.tax.percent}% · ordering ${data.cafe.ordering_enabled ? "on" : "off"}`,
    });
    return { ok: true };
  });

export const getLists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await staff(context);
    const { admin } = await import("./cafe.server");
    const db = await admin();
    const [{ data: categories }, { data: products }, { data: tables }, { data: discounts }, { data: inventory }, { data: audit }, { data: staffRows }] =
      await Promise.all([
        db.from("categories").select("*").order("sort_order"),
        db.from("products").select("*").order("sort_order"),
        db.from("cafe_tables").select("*").order("sort_order"),
        db.from("discounts").select("*").order("created_at", { ascending: false }),
        db.from("inventory_items").select("*").order("name"),
        db.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
        db.from("profiles").select("*, user_roles:id(*)").limit(50),
      ]);
    const { data: roles } = await db.from("user_roles").select("*");
    return {
      categories: categories ?? [],
      products: products ?? [],
      tables: tables ?? [],
      discounts: discounts ?? [],
      inventory: inventory ?? [],
      audit: audit ?? [],
      staff: (staffRows ?? []).map((s) => ({
        ...s,
        roles: (roles ?? []).filter((r) => r.user_id === s.id).map((r) => r.role),
      })),
    };
  });

export const saveDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        code: z.string().min(2).max(30),
        type: z.enum(["PERCENT", "FIXED"]),
        value: z.number().min(0).max(100000),
        min_order: z.number().min(0).max(100000),
        usage_limit: z.number().int().min(0).max(100000).nullable().optional(),
        active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await staff(context, ["MANAGER"]);
    const { admin } = await import("./cafe.server");
    const db = await admin();
    const { id, ...rest } = data;
    const payload = {
      code: data.code.trim().toUpperCase(),
      type: data.type,
      value: data.value,
      min_order: data.min_order,
      active: data.active,
      usage_limit: data.usage_limit ?? null,
    };
    const { error } = id
      ? await db.from("discounts").update(payload).eq("id", id)
      : await db.from("discounts").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(80),
        unit: z.string().min(1).max(15),
        stock: z.number().min(0).max(1000000),
        min_stock: z.number().min(0).max(1000000),
        cost: z.number().min(0).max(1000000),
        supplier: z.string().max(80).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await staff(context, ["MANAGER"]);
    const { admin } = await import("./cafe.server");
    const db = await admin();
    const { id, ...rest } = data;
    const payload = {
      name: data.name,
      unit: data.unit,
      stock: data.stock,
      min_stock: data.min_stock,
      cost: data.cost,
      supplier: data.supplier ?? null,
    };
    const { error } = id
      ? await db.from("inventory_items").update(payload).eq("id", id)
      : await db.from("inventory_items").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getManagerTableFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await staff(context, ["MANAGER"]);
    const { admin, round2, getSettings } = await import("./cafe.server");
    const db = await admin();
    const { cafe, tax } = await getSettings();

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const [{ data: tables }, { data: sessions }, { data: recentPayments }] = await Promise.all([
      db.from("cafe_tables").select("*").order("sort_order"),
      db.from("table_sessions").select("*").eq("status", "ACTIVE"),
      db
        .from("payments")
        .select("*, cafe_tables(name), table_sessions(code)")
        .gte("created_at", twoHoursAgo)
        .order("created_at", { ascending: false }),
    ]);

    const activeIds = (sessions ?? []).map((s) => s.id);
    const [{ data: activeOrders }, { data: activePayments }] = await Promise.all([
      activeIds.length
        ? db
            .from("orders")
            .select("id, order_number, session_id, table_id, subtotal, tax_amount, total, status, created_at, order_items(*)")
            .in("session_id", activeIds)
        : Promise.resolve({ data: [] as any[] }),
      activeIds.length
        ? db
            .from("payments")
            .select("*")
            .in("session_id", activeIds)
            .eq("status", "SUCCESS")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const tableCards = (tables ?? []).map((t) => {
      const session = (sessions ?? []).find((s) => s.table_id === t.id) ?? null;
      const orders = (activeOrders ?? []).filter((o) => o.session_id === session?.id && o.status !== "CANCELLED");
      const subtotal = round2(orders.reduce((sum, o) => sum + Number(o.subtotal ?? o.total), 0));
      const taxAmount = round2(orders.reduce((sum, o) => sum + Number(o.tax_amount ?? 0), 0));
      const grandTotal = round2(orders.reduce((sum, o) => sum + Number(o.total), 0));
      const cgst = round2(taxAmount / 2);
      const sgst = round2(taxAmount - cgst);
      const payment = session ? (activePayments ?? []).find((p) => p.session_id === session.id) : null;
      const isPaid = session ? ["PAID", "CASH_PAID"].includes(session.payment_state) : false;

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        capacity: t.capacity,
        status: t.status,
        session: session
          ? {
              id: session.id,
              code: session.code,
              payment_state: session.payment_state,
              opened_at: session.opened_at,
              customer_name: session.customer_name,
            }
          : null,
        orderCount: orders.length,
        billSubtotal: subtotal,
        billTax: taxAmount,
        billCgst: cgst,
        billSgst: sgst,
        taxRate: Number(tax.percent ?? 5),
        taxName: tax.name ?? "GST",
        billTotal: grandTotal,
        isPaid,
        cafe: {
          name: cafe.name || "Saavic Healthy Café",
          tagline: cafe.tagline || "EAT CLEAN • FEEL STRONG • LIVE BETTER",
          address: cafe.address || "Plot 42, Road No. 36, Jubilee Hills, Hyderabad - 500033",
          phone: cafe.phone || "+91 98765 43210",
          gstin: cafe.gstin || "36AAGCS1234F1Z1",
          fssai: cafe.fssai || "13624011000123",
          sac_code: cafe.sac_code || "996331",
        },
        paidDetails: payment
          ? {
              transactionId: payment.razorpay_payment_id || payment.id,
              paidAt: payment.created_at,
              method: payment.method || payment.provider,
              provider: payment.provider,
              amount: Number(payment.amount),
              notes: payment.notes,
            }
          : null,
        orders: orders.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          status: o.status,
          subtotal: Number(o.subtotal ?? o.total),
          tax_amount: Number(o.tax_amount ?? 0),
          total: Number(o.total),
          created_at: o.created_at,
          items: (o.order_items ?? []).map((i: any) => `${i.product_name} × ${i.quantity}`),
          order_items: (o.order_items ?? []).map((i: any) => ({
            id: i.id,
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: Number(i.unit_price),
            line_total: Number(i.line_total),
          })),
        })),
      };
    });

    return {
      tables: tableCards,
      cafe: {
        name: cafe.name || "Saavic Healthy Café",
        tagline: cafe.tagline || "EAT CLEAN • FEEL STRONG • LIVE BETTER",
        address: cafe.address || "Plot 42, Road No. 36, Jubilee Hills, Hyderabad - 500033",
        phone: cafe.phone || "+91 98765 43210",
        gstin: cafe.gstin || "36AAGCS1234F1Z1",
        fssai: cafe.fssai || "13624011000123",
        sac_code: cafe.sac_code || "996331",
      },
      recentPayments: (recentPayments ?? []).map((p) => ({
        id: p.id,
        transactionId: p.razorpay_payment_id || p.id,
        amount: Number(p.amount),
        provider: p.provider,
        method: p.method || p.provider,
        status: p.status,
        tableName: (p as any).cafe_tables?.name ?? "Table",
        sessionCode: (p as any).table_sessions?.code ?? "",
        createdAt: p.created_at,
        notes: p.notes,
      })),
      windowStart: twoHoursAgo,
    };
  });

export const getReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ from: z.string(), to: z.string() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER"]);
    const isSuperAdmin = me.roles.includes("SUPER_ADMIN");

    // Managers are strictly restricted to the last 2 hours. Full reports are reserved for Super Admin.
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    if (!isSuperAdmin && new Date(data.from) < new Date(twoHoursAgo)) {
      throw new Error("Manager access is limited to recent payments (up to 2 hours). Full financial reports are restricted to Super Admin.");
    }

    const { admin, round2 } = await import("./cafe.server");
    const db = await admin();
    const [{ data: orders }, { data: payments }] = await Promise.all([
      db
        .from("orders")
        .select("*, order_items(*), cafe_tables(name)")
        .gte("created_at", data.from)
        .lte("created_at", data.to),
      db.from("payments").select("*").gte("created_at", data.from).lte("created_at", data.to),
    ]);

    const valid = (orders ?? []).filter((o) => o.status !== "CANCELLED");
    const totalSales = round2(
      (payments ?? []).filter((p) => p.status === "SUCCESS").reduce((s, p) => s + Number(p.amount), 0),
    );
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of valid)
      for (const i of o.order_items ?? []) {
        const cur = productMap.get(i.product_name) ?? { name: i.product_name, qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue = round2(cur.revenue + Number(i.line_total));
        productMap.set(i.product_name, cur);
      }
    const byDay = new Map<string, number>();
    for (const o of valid) {
      const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
        new Date(o.created_at),
      );
      byDay.set(day, round2((byDay.get(day) ?? 0) + Number(o.total)));
    }
    const methods = new Map<string, number>();
    for (const p of (payments ?? []).filter((p) => p.status === "SUCCESS")) {
      const key = p.provider === "CASH" ? "Cash" : "Razorpay";
      methods.set(key, round2((methods.get(key) ?? 0) + Number(p.amount)));
    }

    return {
      totalSales,
      orderCount: valid.length,
      cancelled: (orders ?? []).length - valid.length,
      avgOrderValue: valid.length ? round2(valid.reduce((s, o) => s + Number(o.total), 0) / valid.length) : 0,
      topProducts: [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      byDay: [...byDay.entries()].map(([day, total]) => ({ day, total })).sort((a, b) => a.day.localeCompare(b.day)),
      paymentMethods: [...methods.entries()].map(([name, total]) => ({ name, total })),
      orders: valid.map((o) => ({
        order_number: o.order_number,
        table: o.cafe_tables?.name ?? "",
        status: o.status,
        total: Number(o.total),
        created_at: o.created_at,
      })),
      isSuperAdmin,
    };
  });

export const exportFinancialReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "TABLE", "CUSTOM"]),
        from: z.string().optional(),
        to: z.string().optional(),
        tableSlug: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    // Strictly restricted to SUPER_ADMIN
    await staff(context, ["SUPER_ADMIN"]);
    const { admin, round2, getSettings } = await import("./cafe.server");
    const db = await admin();
    const settings = await getSettings();

    const now = new Date();
    let fromDate: Date;
    let toDate: Date = new Date();
    let periodLabel = "Report";

    if (data.period === "DAILY") {
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
      periodLabel = `Daily_${fromDate.toISOString().slice(0, 10)}`;
    } else if (data.period === "WEEKLY") {
      fromDate = new Date();
      const day = fromDate.getDay();
      const diff = fromDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
      fromDate.setDate(diff);
      fromDate.setHours(0, 0, 0, 0);
      periodLabel = `Weekly_${fromDate.toISOString().slice(0, 10)}_to_${toDate.toISOString().slice(0, 10)}`;
    } else if (data.period === "MONTHLY") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      periodLabel = `Monthly_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    } else if (data.period === "YEARLY") {
      fromDate = new Date(now.getFullYear(), 0, 1);
      periodLabel = `Yearly_${now.getFullYear()}`;
    } else if (data.period === "TABLE") {
      fromDate = new Date(now.getFullYear(), 0, 1); // whole year for this table
      periodLabel = `Table_${data.tableSlug || "all"}`;
    } else {
      fromDate = data.from ? new Date(data.from) : new Date(now.getTime() - 30 * 86400000);
      toDate = data.to ? new Date(data.to) : new Date();
      periodLabel = `Custom_${fromDate.toISOString().slice(0, 10)}_to_${toDate.toISOString().slice(0, 10)}`;
    }

    let ordersQuery = db
      .from("orders")
      .select("*, order_items(*), cafe_tables(name, slug), table_sessions(code, payment_state)")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString())
      .order("created_at", { ascending: false });

    if (data.period === "TABLE" && data.tableSlug) {
      const { data: tbl } = await db.from("cafe_tables").select("id").eq("slug", data.tableSlug).single();
      if (tbl) ordersQuery = ordersQuery.eq("table_id", tbl.id);
    }

    const [{ data: orders }, { data: payments }] = await Promise.all([
      ordersQuery,
      db
        .from("payments")
        .select("*")
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString()),
    ]);

    const validOrders = (orders ?? []).filter((o) => o.status !== "CANCELLED");

    // Format Sheet 1: Detailed Bills
    const bills = validOrders.map((o) => {
      const dateObj = new Date(o.created_at);
      const dateIST = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "short" }).format(dateObj);
      const timeIST = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", timeStyle: "medium" }).format(dateObj);
      const payment = (payments ?? []).find((p) => p.session_id === o.session_id && p.status === "SUCCESS");
      const itemsText = (o.order_items ?? []).map((i: any) => `${i.product_name} (${i.quantity}x)`).join("; ");

      let paymentTimeIST = "-";
      if (payment?.created_at) {
        const pDate = new Date(payment.created_at);
        paymentTimeIST = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          dateStyle: "short",
          timeStyle: "medium",
        }).format(pDate);
      }

      return {
        "Bill / Order No.": o.order_number,
        "Session Code": (o as any).table_sessions?.code || "-",
        "Table": (o as any).cafe_tables?.name ?? "Table",
        "Bill Date (IST)": dateIST,
        "Bill Time (IST)": timeIST,
        "Order Status": o.status,
        "Payment Status": payment ? "PAID" : ((o as any).table_sessions?.payment_state || "PENDING"),
        "Transaction ID": payment?.razorpay_payment_id || payment?.id || "-",
        "Payment Time (IST)": paymentTimeIST,
        "Payment Provider": payment ? (payment.provider === "CASH" ? "Cash at Counter" : payment.provider === "UPI" ? "UPI QR" : payment.provider === "CARD" ? "Card POS" : "Razorpay Online") : "Pending",
        "Payment Method": payment?.method || (payment?.provider === "CASH" ? "CASH" : "ONLINE"),
        "Customer Name": o.customer_name || "Guest",
        "Phone": o.customer_phone || "-",
        "Subtotal (INR)": Number(o.subtotal),
        "Discount (INR)": Number(o.discount_amount),
        "Taxable Value (INR)": Math.max(0, Number(o.subtotal) - Number(o.discount_amount)),
        "GST (5%) (INR)": Number(o.tax_amount),
        "Total Amount (INR)": Number(o.total),
        "Items Summary": itemsText,
      };
    });

    // Format Sheet 2: Payments & Transactions Ledger
    const transactionsLedger = (payments ?? [])
      .filter((p) => p.status === "SUCCESS")
      .map((p) => {
        const pDate = new Date(p.created_at);
        const dateIST = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "short" }).format(pDate);
        const timeIST = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", timeStyle: "medium" }).format(pDate);
        const orderForSession = validOrders.find((o) => o.session_id === p.session_id);
        const tableName = (orderForSession as any)?.cafe_tables?.name || "Table";
        const sessionCode = (orderForSession as any)?.table_sessions?.code || "-";

        return {
          "Transaction ID": p.razorpay_payment_id || p.id,
          "Payment Date (IST)": dateIST,
          "Payment Time (IST)": timeIST,
          "Table": tableName,
          "Session Code": sessionCode,
          "Payment Method": p.method || p.provider,
          "Payment Provider": p.provider === "CASH" ? "Cash at Counter" : p.provider === "UPI" ? "UPI QR" : p.provider === "CARD" ? "Card POS" : "Razorpay Online",
          "Amount Paid (INR)": Number(p.amount),
          "Status": p.status,
          "Reference / Gateway ID": p.razorpay_payment_id || p.id,
          "Notes": p.notes || "-",
        };
      });

    // Format Sheet 3: Item-wise Sales
    const itemMap = new Map<string, { name: string; category: string; qty: number; sales: number }>();
    for (const o of validOrders) {
      for (const i of o.order_items ?? []) {
        const cur = itemMap.get(i.product_name) ?? { name: i.product_name, category: "Menu", qty: 0, sales: 0 };
        cur.qty += i.quantity;
        cur.sales = round2(cur.sales + Number(i.line_total));
        itemMap.set(i.product_name, cur);
      }
    }
    const itemSales = [...itemMap.values()]
      .sort((a, b) => b.sales - a.sales)
      .map((i) => ({
        "Item Name": i.name,
        "Category": i.category,
        "Quantity Sold": i.qty,
        "Total Sales (INR)": i.sales,
      }));

    // Format Sheet 4: Payment Breakdown & GST
    const cashTotal = round2(
      (payments ?? []).filter((p) => p.status === "SUCCESS" && p.provider === "CASH").reduce((s, p) => s + Number(p.amount), 0),
    );
    const onlineTotal = round2(
      (payments ?? []).filter((p) => p.status === "SUCCESS" && p.provider !== "CASH").reduce((s, p) => s + Number(p.amount), 0),
    );

    const paymentSummary = [
      {
        "Payment Provider": "Cash at Counter",
        "Transactions Count": (payments ?? []).filter((p) => p.status === "SUCCESS" && p.provider === "CASH").length,
        "Total Collected (INR)": cashTotal,
      },
      {
        "Payment Provider": "Razorpay (UPI / Card / Netbanking)",
        "Transactions Count": (payments ?? []).filter((p) => p.status === "SUCCESS" && p.provider !== "CASH").length,
        "Total Collected (INR)": onlineTotal,
      },
      {
        "Payment Provider": "TOTAL REVENUE",
        "Transactions Count": (payments ?? []).filter((p) => p.status === "SUCCESS").length,
        "Total Collected (INR)": round2(cashTotal + onlineTotal),
      },
    ];

    const totalSubtotal = round2(validOrders.reduce((s, o) => s + Number(o.subtotal), 0));
    const totalTax = round2(validOrders.reduce((s, o) => s + Number(o.tax_amount), 0));
    const totalGross = round2(validOrders.reduce((s, o) => s + Number(o.total), 0));

    const taxSummary = [
      {
        "Tax Name": settings.tax.name || "GST",
        "Tax Rate": `${settings.tax.percent || 5}%`,
        "Taxable Amount (INR)": totalSubtotal,
        "Tax Collected (INR)": totalTax,
        "Gross Sales (INR)": totalGross,
      },
    ];

    return {
      periodLabel,
      bills,
      transactionsLedger,
      itemSales,
      paymentSummary,
      taxSummary,
      summary: {
        totalSales: totalGross,
        totalTax,
        totalOrders: validOrders.length,
        avgOrderValue: validOrders.length ? round2(totalGross / validOrders.length) : 0,
      },
    };
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(["SUPER_ADMIN", "MANAGER", "KITCHEN_STAFF"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["SUPER_ADMIN"]);
    const { admin, logAudit } = await import("./cafe.server");
    const db = await admin();
    const { data: profile } = await db
      .from("profiles")
      .select("id")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (!profile) throw new Error("No staff account found with that email. Ask them to sign up first.");
    await db.from("user_roles").upsert({ user_id: profile.id, role: data.role }, { onConflict: "user_id,role" });
    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: "ROLE_ASSIGNED",
      object_type: "user",
      object_id: profile.id,
      description: `${data.email} → ${data.role}`,
    });
    return { ok: true };
  });
