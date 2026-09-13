import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Ctx = { supabase: { rpc: (fn: string, args: unknown) => Promise<{ data: unknown }> }; userId: string; claims: Record<string, unknown> };

type Role = "SUPER_ADMIN" | "MANAGER" | "KITCHEN_STAFF" | "CASHIER";

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
    if (data.status && data.status !== "ALL") q = q.eq("status", data.status);
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
    const { data } = await db
      .from("orders")
      .select("*, order_items(*), cafe_tables(name)")
      .in("status", ["PLACED", "ACCEPTED", "PREPARING", "READY"])
      .order("created_at");
    return data ?? [];
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
    const me = await staff(context, ["MANAGER", "KITCHEN_STAFF", "CASHIER"]);
    const { admin, logAudit } = await import("./cafe.server");
    const db = await admin();
    if (data.status === "CANCELLED" && !data.reason?.trim())
      throw new Error("A cancellation reason is required.");

    const patch: Record<string, unknown> = { status: data.status, updated_at: new Date().toISOString() };
    if (data.status === "ACCEPTED") patch["accepted_at"] = new Date().toISOString();
    if (data.status === "READY") patch["ready_at"] = new Date().toISOString();
    if (data.status === "SERVED") patch["served_at"] = new Date().toISOString();
    if (data.status === "CANCELLED") patch["cancel_reason"] = data.reason?.trim();

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
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER", "CASHIER"]);
    const { admin, computeBill, logAudit } = await import("./cafe.server");
    const db = await admin();
    const bill = await computeBill(data.sessionId);
    if (bill.due <= 0) return { ok: true, alreadyPaid: true };
    await db.from("payments").insert({
      session_id: data.sessionId,
      table_id: bill.session!.table_id,
      provider: "CASH",
      amount: bill.due,
      status: "SUCCESS",
      method: "CASH",
      recorded_by: me.userId,
      notes: `Cash recorded by ${me.email ?? me.userId}`,
    });
    await db.from("table_sessions").update({ payment_state: "CASH_PAID" }).eq("id", data.sessionId);
    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: "CASH_PAYMENT_RECORDED",
      object_type: "session",
      object_id: data.sessionId,
      description: `Cash ₹${bill.due} recorded for ${bill.session!.code}`,
    });
    return { ok: true, amount: bill.due };
  });

export const closeTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const me = await staff(context, ["MANAGER", "CASHIER"]);
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
    const { error } = data.id
      ? await db.from("products").update({ ...data, updated_at: new Date().toISOString() }).eq("id", data.id)
      : await db.from("products").insert(data);
    if (error) throw new Error(error.message);
    await logAudit({
      user_id: me.userId,
      user_email: me.email,
      action: data.id ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
      object_type: "product",
      object_id: data.id ?? data.slug,
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
    const { error } = data.id
      ? await db.from("categories").update(data).eq("id", data.id)
      : await db.from("categories").insert(data);
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
    const { error } = data.id
      ? await db.from("cafe_tables").update(data).eq("id", data.id)
      : await db.from("cafe_tables").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Settings / discounts / inventory / reports / audit ----------
export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await staff(context);
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
    const me = await staff(context, ["MANAGER"]);
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
    const payload = { ...data, code: data.code.trim().toUpperCase() };
    const { error } = data.id
      ? await db.from("discounts").update(payload).eq("id", data.id)
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
    const { error } = data.id
      ? await db.from("inventory_items").update(data).eq("id", data.id)
      : await db.from("inventory_items").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ from: z.string(), to: z.string() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await staff(context, ["MANAGER", "CASHIER"]);
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
    };
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(["SUPER_ADMIN", "MANAGER", "KITCHEN_STAFF", "CASHIER"]),
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
