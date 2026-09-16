import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Home,
  UtensilsCrossed,
  ReceiptText,
  ShoppingBag,
  Search,
  Leaf,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Phone,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductDialog, type MenuProduct, type ModifierGroup } from "@/components/customer/ProductDialog";
import { ComboPopup } from "@/components/customer/ComboPopup";

import { getMenu, getTableContext, placeOrder, getSessionState } from "@/lib/customer.functions";
import { createBillPayment, verifyBillPayment, markPaymentFailed } from "@/lib/payments.functions";
import { useCart, readStoredSession, writeStoredSession } from "@/lib/cart";
import { inr, istTime, newIdempotencyKey, ORDER_FLOW, statusLabel } from "@/lib/format";

import smoothieImg from "@/assets/smoothies.jpg";
import saladImg from "@/assets/salads.jpg";
import bitesImg from "@/assets/quick-bites.jpg";
import shotsImg from "@/assets/shots.jpg";

export const Route = createFileRoute("/t/$slug")({
  head: () => ({
    meta: [
      { title: "Order at your table | Saavic Healthy Café" },
      {
        name: "description",
        content:
          "Scan, browse and order fresh smoothies, salads, quick bites and wellness shots straight from your table at Saavic Healthy Café.",
      },
      { property: "og:title", content: "Order at your table | Saavic Healthy Café" },
      {
        property: "og:description",
        content: "Fresh food. Simple ordering. Browse the Saavic menu and order from your table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerPortal,
});

const categoryImage = (slug: string | undefined) => {
  switch (slug) {
    case "smoothies":
      return smoothieImg;
    case "fresh-salads":
    case "meal-plans":
      return saladImg;
    case "wellness-shots":
      return shotsImg;
    default:
      return bitesImg;
  }
};

type Tab = "home" | "menu" | "orders" | "cart";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function CustomerPortal() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const cart = useCart(slug);

  const [tab, setTab] = useState<Tab>("home");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [session, setSession] = useState<{ sessionId: string; sessionToken: string } | null>(null);
  const orderKeyRef = useRef(newIdempotencyKey());
  const payKeyRef = useRef(newIdempotencyKey());
  const menuTopRef = useRef<HTMLDivElement>(null);

  const menuQuery = useQuery({ queryKey: ["menu"], queryFn: () => getMenu() });
  const tableQuery = useQuery({
    queryKey: ["table", slug],
    queryFn: () => getTableContext({ data: { slug } }),
    retry: false,
  });

  // Restore/align the stored customer session for this table.
  useEffect(() => {
    const stored = readStoredSession(slug);
    const live = tableQuery.data?.session;
    if (live) {
      const next = { sessionId: live.id, sessionToken: live.token };
      writeStoredSession(slug, next);
      setSession(next);
    } else if (stored && tableQuery.data && !tableQuery.data.session) {
      writeStoredSession(slug, null);
      setSession(null);
    } else if (stored) {
      setSession(stored);
    }
  }, [slug, tableQuery.data]);

  const stateQuery = useQuery({
    queryKey: ["session-state", session?.sessionId],
    queryFn: () => getSessionState({ data: session! }),
    enabled: Boolean(session),
    refetchInterval: 6000,
    retry: false,
  });

  const placeOrderFn = useServerFn(placeOrder);
  const createPaymentFn = useServerFn(createBillPayment);
  const verifyPaymentFn = useServerFn(verifyBillPayment);
  const failPaymentFn = useServerFn(markPaymentFailed);

  const menu = menuQuery.data;
  const taxPercent = menu?.tax?.inclusive ? 0 : Number(menu?.tax?.percent ?? 0);
  const taxName = menu?.tax?.name ?? "GST";

  const modifierGroups = useMemo<Record<string, ModifierGroup[]>>(() => {
    if (!menu) return {};
    const map: Record<string, ModifierGroup[]> = {};
    for (const link of menu.links) {
      const mod = menu.modifiers.find((m) => m.id === link.modifier_id);
      if (!mod) continue;
      const group: ModifierGroup = {
        id: mod.id,
        name: mod.name,
        selection_type: mod.selection_type,
        options: menu.options
          .filter((o) => o.modifier_id === mod.id)
          .map((o) => ({ id: o.id, name: o.name, price_delta: Number(o.price_delta) })),
      };
      map[link.product_id] = [...(map[link.product_id] ?? []), group];
    }
    return map;
  }, [menu]);

  const products = useMemo(() => {
    const list = (menu?.products ?? []) as unknown as MenuProduct[];
    const term = search.trim().toLowerCase();
    return list.filter((p) => {
      if (activeCategory && p.category_id !== activeCategory) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) || (p.description ?? "").toLowerCase().includes(term)
      );
    });
  }, [menu, search, activeCategory]);

  const mealPlans = ((menu?.products ?? []) as unknown as MenuProduct[]).filter((p) => p.is_meal_plan);
  const addon = ((menu?.products ?? []) as unknown as MenuProduct[]).find(
    (p) => p.name.startsWith("Wellness Shot Add-on"),
  );

  // Combo popup: first visit only, dismissal remembered.
  useEffect(() => {
    if (!menu) return;
    if (localStorage.getItem("saavic:combo-dismissed")) return;
    const t = setTimeout(() => setComboOpen(true), 4000);
    return () => clearTimeout(t);
  }, [menu]);

  const closeCombo = (open: boolean) => {
    setComboOpen(open);
    if (!open) localStorage.setItem("saavic:combo-dismissed", "1");
  };

  const cartTax = Math.round(((cart.subtotal * taxPercent) / 100) * 100) / 100;
  const cartTotal = cart.subtotal + cartTax;

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      return await placeOrderFn({
        data: {
          tableSlug: slug,
          sessionId: session?.sessionId,
          sessionToken: session?.sessionToken,
          idempotencyKey: orderKeyRef.current,
          notes: orderNotes.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            notes: i.notes,
            modifiers: i.modifiers.map((m) => ({ optionId: m.optionId })),
          })),
        },
      });
    },
    onSuccess: (res) => {
      if (res.sessionToken) {
        const next = { sessionId: res.sessionId, sessionToken: res.sessionToken };
        writeStoredSession(slug, next);
        setSession(next);
      }
      cart.clear();
      setOrderNotes("");
      orderKeyRef.current = newIdempotencyKey();
      toast.success(`Order ${res.orderNumber} is on its way to the kitchen.`);
      setTab("orders");
      queryClient.invalidateQueries({ queryKey: ["session-state"] });
      queryClient.invalidateQueries({ queryKey: ["table", slug] });
    },
    onError: (e: Error) => toast.error(e.message || "We could not place your order. Please try again."),
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("No active table session.");
      const res = await createPaymentFn({ data: { ...session, idempotencyKey: payKeyRef.current } });
      if ("alreadyPaid" in res && res.alreadyPaid) return { paid: true as const };
      if ("demoMode" in res && res.demoMode) return { demo: true as const, message: res.message };

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Payment could not start. Please check your connection.");

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: res.keyId,
          amount: Math.round(res.amount * 100),
          currency: "INR",
          name: "Saavic Healthy Café",
          description: `Table bill · ${stateQuery.data?.session.table?.name ?? ""}`,
          order_id: res.razorpayOrderId,
          prefill: { name: customerName, contact: customerPhone },
          theme: { color: "#2f7d4f" },
          handler: async (response: Record<string, string>) => {
            try {
              await verifyPaymentFn({
                data: {
                  ...session,
                  razorpay_order_id: response["razorpay_order_id"]!,
                  razorpay_payment_id: response["razorpay_payment_id"]!,
                  razorpay_signature: response["razorpay_signature"]!,
                },
              });
              payKeyRef.current = newIdempotencyKey();
              resolve();
            } catch (err) {
              reject(err as Error);
            }
          },
          modal: {
            ondismiss: async () => {
              await failPaymentFn({ data: { ...session, razorpay_order_id: res.razorpayOrderId } });
              payKeyRef.current = newIdempotencyKey();
              reject(new Error("Payment cancelled. Your order is still active."));
            },
          },
        });
        rzp.open();
      });
      return { paid: true as const };
    },
    onSuccess: (r) => {
      if ("demo" in r) toast.info(r.message);
      else toast.success("Payment successful ✓ Thank you for choosing Saavic.");
      queryClient.invalidateQueries({ queryKey: ["session-state"] });
    },
    onError: (e: Error) => toast.error(e.message || "Payment failed. Your order is still active."),
  });

  if (tableQuery.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="surface-card max-w-sm p-8">
          <Leaf className="mx-auto mb-3 h-7 w-7 text-primary" aria-hidden />
          <h1 className="font-display text-xl">We couldn't find this table</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {(tableQuery.error as Error).message} Please contact our staff.
          </p>
        </div>
      </main>
    );
  }

  const table = tableQuery.data?.table;
  const orderingClosed = menu?.cafe?.ordering_enabled === false;
  const state = stateQuery.data;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="hero-gradient px-5 pb-6 pt-7 text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="brand-wordmark text-2xl font-semibold">Saavic</p>
            <p className="text-xs tracking-[0.25em] opacity-90">HEALTHY CAFÉ</p>
          </div>
          <Badge className="bg-primary-foreground/15 text-primary-foreground">
            {table ? table.name : <Skeleton className="h-4 w-16" />}
          </Badge>
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-sm opacity-95">
          Welcome! You're ordering from {table?.name ?? "your table"}.
        </p>
        <div className="mx-auto mt-4 flex max-w-2xl items-center gap-2 rounded-full bg-card px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            aria-label="Search the menu"
            placeholder="What are you craving?"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value) setTab("menu");
            }}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {orderingClosed && (
          <div className="mb-4 rounded-xl border border-warning/40 bg-warning/15 p-4 text-sm">
            Online ordering is currently unavailable. Our staff will be glad to take your order.
          </div>
        )}

        {(tab === "home" || tab === "menu") && (
          <>
            {/* Categories */}
            <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
              <button
                onClick={() => setActiveCategory(null)}
                aria-pressed={activeCategory === null}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                  activeCategory === null ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                }`}
              >
                All
              </button>
              {(menu?.categories ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategory(c.id);
                    setTab("menu");
                    if (c.slug === "meal-plans") setComboOpen(true);
                    menuTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  aria-pressed={activeCategory === c.id}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                    activeCategory === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {tab === "home" && (
              <section className="surface-card leaf-gradient mb-6 overflow-hidden p-5">
                <p className="text-xs font-semibold tracking-widest text-primary">FEATURED</p>
                <h2 className="font-display text-2xl leading-tight">26 DAYS OF CLEAN, HIGH-PROTEIN MEALS</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your daily dose of health. Zero stress.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["FRESH", "PROTEIN-RICH", "BALANCED", "DELIVERED DAILY"].map((f) => (
                    <Badge key={f} variant="secondary">
                      {f}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {mealPlans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="surface-card p-4 text-left transition-transform hover:-translate-y-0.5"
                    >
                      <p className="font-display text-lg">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                      <p className="mt-2 font-semibold text-primary">{inr(p.price)}</p>
                    </button>
                  ))}
                </div>
                {addon && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Optional add-on: Wellness Shot 100 ml × 26 days · {inr(addon.price)}
                  </p>
                )}
              </section>
            )}

            <div ref={menuTopRef} />
            {menuQuery.isLoading && (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            )}

            {!menuQuery.isLoading && products.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">Menu is currently unavailable.</p>
            )}

            <ul className="space-y-3">
              {products.map((p) => {
                const catSlug = menu?.categories.find((c) => c.id === p.category_id)?.slug;
                const out = p.status !== "AVAILABLE";
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelected(p)}
                      className="surface-card flex w-full items-center gap-3 p-3 text-left transition-shadow hover:shadow-float"
                    >
                      <img
                        src={p.image_url || categoryImage(catSlug)}
                        alt={p.name}
                        loading="lazy"
                        width={816}
                        height={816}
                        className="h-20 w-20 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.name}</p>
                        {p.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                        )}
                        <p className="mt-1 font-semibold text-primary">{inr(p.price)}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                          out ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {out ? "Unavailable" : "+ ADD"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === "cart" && (
          <section aria-label="Your cart" className="space-y-4">
            <h2 className="font-display text-2xl">Your cart</h2>
            {cart.items.length === 0 ? (
              <p className="py-14 text-center text-muted-foreground">Your cart is waiting for something fresh.</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {cart.items.map((item) => (
                    <li key={item.key} className="surface-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{item.name}</p>
                          {item.modifiers.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {item.modifiers.map((m) => m.name).join(", ")}
                            </p>
                          )}
                          {item.notes && <p className="text-xs italic text-muted-foreground">“{item.notes}”</p>}
                        </div>
                        <p className="font-semibold">{inr(item.unitPrice * item.quantity)}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() => cart.setQty(item.key, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Increase ${item.name}`}
                          onClick={() => cart.setQty(item.key, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${item.name}`}
                          className="ml-auto text-destructive"
                          onClick={() => cart.remove(item.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="surface-card space-y-3 p-4">
                  <Textarea
                    aria-label="Order notes"
                    maxLength={300}
                    placeholder="Notes for the kitchen, e.g. Please make it less spicy."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      aria-label="Your name (optional)"
                      placeholder="Name (optional)"
                      maxLength={80}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      aria-label="Mobile number (optional)"
                      placeholder="Mobile (optional)"
                      maxLength={20}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="surface-card space-y-2 p-4 text-sm">
                  <Row label="Subtotal" value={inr(cart.subtotal)} />
                  <Row label={`${taxName} (${taxPercent}%)`} value={inr(cartTax)} />
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{inr(cartTotal)}</span>
                  </div>
                  <p className="pt-1 text-muted-foreground">
                    Your order will be prepared for {table?.name ?? "your table"}.
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={placeOrderMutation.isPending || orderingClosed}
                  onClick={() => placeOrderMutation.mutate()}
                >
                  {placeOrderMutation.isPending ? "Placing your order…" : "Place order"}
                </Button>
              </>
            )}
          </section>
        )}

        {tab === "orders" && (
          <section aria-label="Your orders" className="space-y-4">
            <h2 className="font-display text-2xl">Your orders</h2>
            {!session || (state && state.orders.length === 0) ? (
              <p className="py-14 text-center text-muted-foreground">No active orders yet.</p>
            ) : stateQuery.isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : stateQuery.isError ? (
              <p className="py-10 text-center text-muted-foreground">
                {(stateQuery.error as Error).message}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {state?.session.table?.name} · Session {state?.session.code}
                </p>
                <ul className="space-y-3">
                  {state?.orders.map((o) => (
                    <li key={o.id} className="surface-card p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">#{o.order_number}</p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden /> {istTime(o.created_at)}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {o.items.map((i) => (
                          <li key={i.id}>
                            {i.name} × {i.quantity} · {inr(i.line_total)}
                          </li>
                        ))}
                      </ul>
                      {o.status === "CANCELLED" ? (
                        <Badge variant="destructive" className="mt-3">
                          Cancelled
                        </Badge>
                      ) : (
                        <ol className="mt-3 flex flex-wrap gap-3 text-xs">
                          {ORDER_FLOW.slice(0, 5).map((s) => {
                            const done = ORDER_FLOW.indexOf(o.status as never) >= ORDER_FLOW.indexOf(s);
                            return (
                              <li
                                key={s}
                                className={`flex items-center gap-1 ${done ? "text-primary" : "text-muted-foreground"}`}
                              >
                                {done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                ) : (
                                  <Circle className="h-3.5 w-3.5" aria-hidden />
                                )}
                                {statusLabel[s]}
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </li>
                  ))}
                </ul>

                {state && (
                  <div className="surface-card space-y-2 p-4 text-sm">
                    <h3 className="font-display text-lg">Your table bill</h3>
                    <Row label="Subtotal" value={inr(state.bill.subtotal)} />
                    {state.bill.discount > 0 && <Row label="Discount" value={`- ${inr(state.bill.discount)}`} />}
                    <Row label={`${state.bill.taxName} (${state.bill.taxPercent}%)`} value={inr(state.bill.taxAmount)} />
                    <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                      <span>Total</span>
                      <span>{inr(state.bill.total)}</span>
                    </div>
                    {state.bill.paid > 0 && <Row label="Paid" value={inr(state.bill.paid)} />}
                    {state.bill.due <= 0 && state.bill.total > 0 ? (
                      <>
                        <Badge className="mt-2 bg-success text-success-foreground">PAID ✓</Badge>
                        <p className="text-muted-foreground">Please wait while your order is served.</p>
                      </>
                    ) : (
                      <Button
                        className="mt-2 w-full"
                        size="lg"
                        disabled={payMutation.isPending || state.bill.due <= 0}
                        onClick={() => payMutation.mutate()}
                      >
                        {payMutation.isPending ? "Opening payment…" : `Pay bill · ${inr(state.bill.due)}`}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        <footer className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p className="brand-wordmark text-base font-semibold text-foreground">Saavic Healthy Café</p>
          <p className="mt-1 text-xs tracking-widest">EAT CLEAN • FEEL STRONG • LIVE BETTER</p>
          <p className="mt-2">Fresh · Natural · Made to Order</p>
          {menu?.cafe?.address && <p className="mt-2">{menu.cafe.address}</p>}
          <div className="mt-3 flex justify-center gap-2">
            {menu?.cafe?.phone && (
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${menu.cafe.phone}`}>
                  <Phone className="mr-1 h-4 w-4" aria-hidden /> Call
                </a>
              </Button>
            )}
            {menu?.cafe?.whatsapp && (
              <Button asChild variant="outline" size="sm">
                <a href={`https://wa.me/${menu.cafe.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1 h-4 w-4" aria-hidden /> WhatsApp
                </a>
              </Button>
            )}
          </div>
          <Link to="/" className="mt-4 inline-block text-xs underline">
            About Saavic
          </Link>
        </footer>
      </main>

      {/* Sticky cart bar */}
      {cart.count > 0 && tab !== "cart" && (
        <button
          onClick={() => setTab("cart")}
          className="fixed inset-x-4 bottom-20 z-30 mx-auto flex max-w-xl items-center justify-between rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-float"
        >
          <span className="text-sm font-medium">
            {cart.count} item{cart.count > 1 ? "s" : ""} • {inr(cart.subtotal)}
          </span>
          <span className="text-sm font-semibold">VIEW CART</span>
        </button>
      )}

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card">
        <ul className="mx-auto flex max-w-2xl">
          {(
            [
              ["home", "Home", Home],
              ["menu", "Menu", UtensilsCrossed],
              ["orders", "Orders", ReceiptText],
              ["cart", "Cart", ShoppingBag],
            ] as const
          ).map(([value, label, Icon]) => (
            <li key={value} className="flex-1">
              <button
                onClick={() => setTab(value)}
                aria-current={tab === value ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-xs ${
                  tab === value ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
                {value === "cart" && cart.count > 0 && (
                  <span className="absolute mt-[-28px] ml-7 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                    {cart.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <ProductDialog
        product={selected}
        groups={selected ? (modifierGroups[selected.id] ?? []) : []}
        image={
          selected?.image_url ||
          categoryImage(menu?.categories.find((c) => c.id === selected?.category_id)?.slug)
        }
        onClose={() => setSelected(null)}
        onAdd={({ quantity, notes, modifiers }) => {
          if (!selected) return;
          cart.add({
            productId: selected.id,
            name: selected.name,
            unitPrice: Number(selected.price) + modifiers.reduce((s, m) => s + m.price_delta, 0),
            quantity,
            notes: notes || undefined,
            modifiers,
          });
          setSelected(null);
          toast.success("Added to your cart");
        }}
      />

      <ComboPopup
        open={comboOpen}
        onOpenChange={closeCombo}
        plans={mealPlans.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          protein: p.name === "Chicken Fit" ? "30–40g protein daily" : "20–25g protein daily",
        }))}
        addonPrice={addon ? Number(addon.price) : null}
        onViewPlan={(id) => {
          const plan = mealPlans.find((p) => p.id === id) ?? null;
          closeCombo(false);
          setSelected(plan);
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
