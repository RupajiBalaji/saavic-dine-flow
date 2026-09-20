import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  ReceiptText,
  ShoppingBag,
  Search,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Phone,
  Printer,
  ChevronLeft,
  Sparkles,
  QrCode,
  ArrowRight,
  RefreshCw,
  Banknote,
  Smartphone,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductDialog, type MenuProduct, type ModifierGroup } from "@/components/customer/ProductDialog";
import { ComboPopup } from "@/components/customer/ComboPopup";
import { TaxInvoiceReceipt } from "@/components/TaxInvoiceReceipt";
import { TablePickerModal } from "@/components/customer/TablePickerModal";

import { getMenu, getTableContext, placeOrder, getSessionState, getPublicTables } from "@/lib/customer.functions";
import { createBillPayment, verifyBillPayment, markPaymentFailed } from "@/lib/payments.functions";
import { useCart, readStoredSession, writeStoredSession } from "@/lib/cart";
import { inr, istTime, newIdempotencyKey, ORDER_FLOW, statusLabel } from "@/lib/format";

import smoothieImg from "@/assets/smoothies.jpg";
import saladImg from "@/assets/salads.jpg";
import bitesImg from "@/assets/quick-bites.jpg";
import shotsImg from "@/assets/shots.jpg";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu & Dine-in Ordering | Saavic Healthy Café" },
      {
        name: "description",
        content:
          "Select your table, browse our clean-eating menu, customize your order, and pay seamlessly at Saavic Healthy Café.",
      },
      { property: "og:title", content: "Saavic Healthy Café Menu" },
      {
        property: "og:description",
        content: "Fresh smoothies, protein salads, bowls, and clean meals made to order.",
      },
    ],
  }),
  component: MenuOrderingPage,
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

type Tab = "menu" | "cart" | "orders";

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

function MenuOrderingPage() {
  const queryClient = useQueryClient();

  // Active table state (defaults to URL param or localStorage if present; otherwise null so it prompts table selection)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTable = urlParams.get("table");
      if (urlTable) return urlTable;
      return localStorage.getItem("saavic:last-table") || null;
    }
    return null;
  });

  const [showTablePicker, setShowTablePicker] = useState(false);

  // When a table is chosen, remember it
  const handleSelectTable = (slug: string) => {
    setSelectedSlug(slug);
    if (typeof window !== "undefined") {
      localStorage.setItem("saavic:last-table", slug);
    }
    setShowTablePicker(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C211D]">
      {selectedSlug ? (
        <TableMenuFlow
          slug={selectedSlug}
          onChangeTable={() => setShowTablePicker(true)}
        />
      ) : (
        <TableSelectionScreen onSelectTable={handleSelectTable} />
      )}

      {/* Table Selector Modal (when user clicks "Change Table") */}
      <TablePickerModal
        open={showTablePicker}
        onOpenChange={setShowTablePicker}
        onSelect={handleSelectTable}
        currentSlug={selectedSlug}
      />
    </div>
  );
}


// Standalone screen to pick a table if none is set
function TableSelectionScreen({ onSelectTable }: { onSelectTable: (slug: string) => void }) {
  const tablesQuery = useQuery({
    queryKey: ["public-tables"],
    queryFn: () => getPublicTables(),
    refetchInterval: 6000,
  });

  const tables = tablesQuery.data && tablesQuery.data.length > 0
    ? tablesQuery.data
    : Array.from({ length: 20 }, (_, i) => {
        const num = i + 1;
        const str = num < 10 ? `0${num}` : `${num}`;
        return { id: `t-${num}`, name: `Table ${str}`, slug: `table-${str}`, capacity: 4, isOccupied: false };
      });

  const handleTableClick = (t: { name: string; slug: string; isOccupied: boolean }) => {
    if (t.isOccupied) {
      toast.error(`${t.name} is currently occupied by other guests. Please choose an available table.`, {
        description: "If you are seated at this table, please check with our café staff.",
      });
      return;
    }
    onSelectTable(t.slug);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div>
        <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-4 mb-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo-monogram-green.png" alt="Saavic" className="w-8 h-8 object-contain" />
            <div>
              <span className="font-serif text-base font-bold tracking-[2px] uppercase text-[#163E24] block">
                SAAVIC HEALTHY CAFÉ
              </span>
              <span className="text-[9px] uppercase tracking-[1.5px] text-[#4A6046] font-semibold block">
                EAT CLEAN • FEEL STRONG • LIVE BETTER
              </span>
            </div>
          </Link>

          <Link
            to="/home"
            className="text-xs font-semibold text-[#4A6046] hover:text-[#163E24] px-3 py-1.5 rounded-full hover:bg-[#EDE9E1] transition-colors"
          >
            About Café
          </Link>
        </div>

        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#CDE1D2] text-[11px] font-bold tracking-[1.5px] uppercase text-[#1B4D2E] mb-3">
            <QrCode className="w-3.5 h-3.5" />
            <span>Dine-In Table Selection</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#163E24]">
            Select Your Table Number
          </h1>
          <p className="text-xs sm:text-sm text-[#5D665A] mt-2">
            Please tap your seated table number below to access our menu, place orders directly to the kitchen, and pay from your seat.
          </p>

          {/* Status Legend */}
          <div className="flex items-center justify-center gap-5 pt-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Not Available (Filled)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {tables.map((t) => {
            const isOccupied = t.isOccupied;

            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => handleTableClick(t)}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between group ${
                  isOccupied
                    ? "bg-stone-100/90 border-stone-200 text-stone-500 opacity-75 cursor-not-allowed hover:border-rose-300"
                    : "bg-white border-[#E8E2D5] hover:border-[#1B4D2E] hover:bg-[#EAF2EC] shadow-2xs hover:shadow-md cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isOccupied ? "text-rose-600" : "text-[#6E7B6C]"
                    }`}
                  >
                    {isOccupied ? "Occupied" : "Dine-in"}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOccupied ? "bg-rose-500" : "bg-emerald-600 group-hover:scale-125 transition-transform"
                    }`}
                  />
                </div>

                <div>
                  <p
                    className={`font-serif font-bold text-lg ${
                      isOccupied ? "text-stone-600" : "text-[#163E24] group-hover:text-[#1B4D2E]"
                    }`}
                  >
                    {t.name}
                  </p>
                  <p className="text-[11px] mt-1 flex items-center justify-between">
                    {isOccupied ? (
                      <span className="text-rose-600 font-bold">Not Available</span>
                    ) : (
                      <>
                        <span className="text-emerald-700 font-bold">Available</span>
                        <span className="text-[#1B4D2E] font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Order →
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center pt-10 text-xs text-[#7A8277]">
        <p>Looking for café information or our clean food story?</p>
        <Link to="/home" className="font-bold text-[#163E24] underline hover:text-[#1B4D2E] mt-1 inline-block">
          Visit About Café Page
        </Link>
      </div>
    </div>
  );
}


// Complete Menu, Cart, Order, and Payment flow for a given table slug
function TableMenuFlow({
  slug,
  onChangeTable,
}: {
  slug: string;
  onChangeTable: () => void;
}) {
  const queryClient = useQueryClient();
  const cart = useCart(slug);

  const [tab, setTab] = useState<Tab>("menu");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [session, setSession] = useState<{ sessionId: string; sessionToken: string } | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const orderKeyRef = useRef(newIdempotencyKey());
  const payKeyRef = useRef(newIdempotencyKey());

  const menuQuery = useQuery({ queryKey: ["menu"], queryFn: () => getMenu() });
  const tableQuery = useQuery({
    queryKey: ["table", slug],
    queryFn: () => getTableContext({ data: { slug } }),
    retry: false,
  });

  // Align active customer session
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

  const cartTax = Math.round(((cart.subtotal * taxPercent) / 100) * 100) / 100;
  const cartTotal = cart.subtotal + cartTax;

  // Place Order Mutation
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
      toast.success(`Order ${res.orderNumber} sent to the kitchen!`);
      setTab("orders");
      queryClient.invalidateQueries({ queryKey: ["session-state"] });
      queryClient.invalidateQueries({ queryKey: ["table", slug] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to place order. Please try again."),
  });

  // Pay Bill Mutation
  const payMutation = useMutation({
    mutationFn: async (method: "ONLINE" | "CASH") => {
      if (!session) throw new Error("No active order session found.");
      const res = await createPaymentFn({
        data: {
          ...session,
          idempotencyKey: payKeyRef.current,
          paymentMethod: method,
        },
      });

      if (method === "CASH") {
        return { cashRequested: true as const, paid: false as const, method };
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Payment gateway could not load. Check your internet connection.");

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: res.keyId,
          amount: Math.round(res.amount * 100),
          currency: "INR",
          name: "Saavic Healthy Café",
          description: `Table bill · ${tableQuery.data?.table?.name ?? slug}`,
          order_id: res.razorpayOrderId,
          prefill: { name: customerName, contact: customerPhone },
          theme: { color: "#1B4D2E" },
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
              reject(new Error("Payment cancelled."));
            },
          },
        });
        rzp.open();
      });
      return { paid: true as const, method };
    },
    onSuccess: (data: any) => {
      setShowPaymentModal(false);
      if (data?.cashRequested) {
        toast.info("Cashier notified. You can pay at the counter with Cash or UPI.");
      } else {
        toast.success("Payment completed ✓ Thank you for dining with Saavic.");
        setShowInvoice(true);
      }
      queryClient.invalidateQueries({ queryKey: ["session-state"] });
      queryClient.invalidateQueries({ queryKey: ["table", slug] });
    },
    onError: (e: Error) => toast.error(e.message || "Payment failed. Please try again."),
  });

  const table = tableQuery.data?.table;
  const state = stateQuery.data;
  const activeOrders = (state?.orders ?? []).filter((o) => o.status !== "CANCELLED");
  const hasActiveOrders = activeOrders.length > 0;
  const billTotal = state?.bill?.total ?? 0;
  const isPaid = state?.session?.payment_state === "PAID" || state?.session?.payment_state === "CASH_PAID";

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-36 sm:pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE6DE]">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/home"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A6046] hover:text-[#163E24] px-2 py-1 rounded-full hover:bg-[#EDE9E1] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </Link>
            <div className="h-4 w-px bg-[#D9D3C7]" />
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
              <img
                src="/images/logo-monogram-green.png"
                alt="Saavic"
                className="w-5 sm:w-6 h-5 sm:h-6 object-contain shrink-0"
              />
              <span className="font-serif text-xs sm:text-sm font-bold tracking-wider text-[#163E24]">
                SAAVIC
              </span>
            </Link>
          </div>

          {/* Active Table Pill with Change Table button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onChangeTable}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#EAF2EC] border border-[#CDE1D2] text-[#163E24] text-xs font-bold hover:bg-[#d8ebd9] active:scale-95 transition-all cursor-pointer"
              title="Click to switch table"
            >
              <span className="w-2 h-2 rounded-full bg-[#1B4D2E] animate-pulse" />
              <span>{table ? table.name : slug.replace("-", " ").toUpperCase()}</span>
              <span className="text-[10px] text-[#4A6046] font-normal underline ml-0.5 sm:ml-1">Change</span>
            </button>

            {cart.items.length > 0 && tab !== "cart" && (
              <button
                onClick={() => setTab("cart")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B4D2E] text-white text-xs font-bold shadow-xs hover:bg-[#143B23] transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Cart ({cart.count})</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-[#E8E2D5] px-3.5 py-2 shadow-2xs">
            <Search className="w-4 h-4 text-[#7A8578]" />
            <input
              type="text"
              placeholder="Search smoothies, bowls, protein plates, shots..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (tab !== "menu") setTab("menu");
              }}
              className="w-full bg-transparent text-xs sm:text-sm text-[#1C211D] outline-none placeholder:text-[#8E998B]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-[#8E998B] hover:text-[#1C211D]">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        {tab === "menu" && (
          <div className="max-w-4xl mx-auto px-4 flex gap-2 overflow-x-auto pb-2.5 no-scrollbar">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeCategory === null
                  ? "bg-[#1B4D2E] text-white"
                  : "bg-white border border-[#E8E2D5] text-[#4F584C] hover:bg-[#EDE9E1]"
              }`}
            >
              All Items
            </button>
            {(menu?.categories ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  activeCategory === c.id
                    ? "bg-[#1B4D2E] text-white"
                    : "bg-white border border-[#E8E2D5] text-[#4F584C] hover:bg-[#EDE9E1]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-4">
        {/* TAB 1: MENU CATALOG */}
        {tab === "menu" && (
          <div>
            {/* Products Grid */}
            {menuQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl bg-[#EDE9E1]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm font-semibold text-[#5D665A]">No dishes match your search.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveCategory(null);
                  }}
                  className="mt-2 text-xs font-bold text-[#1B4D2E] underline"
                >
                  View all items
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                  const hasMods = (modifierGroups[product.id] ?? []).length > 0;
                  const inCartQty = cart.items
                    .filter((i) => i.productId === product.id)
                    .reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <article
                      key={product.id}
                      className="bg-white rounded-2xl border border-[#E8E2D5] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div
                        className="relative h-44 w-full cursor-pointer overflow-hidden"
                        onClick={() => setSelected(product)}
                      >
                        <img
                          src={
                            product.image_url ||
                            categoryImage(menu?.categories.find((c) => c.id === product.category_id)?.slug)
                          }
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                        {product.is_meal_plan && (
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#163E24] text-white text-[10px] font-bold tracking-wider uppercase">
                            26-Day Plan
                          </span>
                        )}
                        {product.is_veg != null && (
                          <span
                            className={`absolute top-2.5 right-2.5 w-4 h-4 rounded-xs border flex items-center justify-center bg-white ${
                              product.is_veg ? "border-green-600" : "border-red-600"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                product.is_veg ? "bg-green-600" : "bg-red-600"
                              }`}
                            />
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              onClick={() => setSelected(product)}
                              className="font-serif font-bold text-base text-[#163E24] hover:text-[#1B4D2E] cursor-pointer"
                            >
                              {product.name}
                            </h3>
                            <span className="font-bold text-sm text-[#163E24] shrink-0">
                              {inr(Number(product.price))}
                            </span>
                          </div>

                          {product.description && (
                            <p className="text-xs text-[#5D665A] mt-1 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {product.calories != null && (
                              <span className="text-[10px] font-medium bg-[#FAF8F5] border border-[#E8E2D5] px-2 py-0.5 rounded-md text-[#5D665A]">
                                {product.calories} kcal
                              </span>
                            )}
                            {product.protein != null && (
                              <span className="text-[10px] font-bold bg-[#EAF2EC] text-[#1B4D2E] px-2 py-0.5 rounded-md">
                                {product.protein}g protein
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                          {hasMods ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelected(product)}
                              className="w-full rounded-full border-[#1B4D2E] text-[#1B4D2E] hover:bg-[#EAF2EC] text-xs font-bold h-9 active:scale-98 transition-transform cursor-pointer"
                            >
                              {inCartQty > 0 ? `Customise (${inCartQty})` : "Customise & Add +"}
                            </Button>
                          ) : inCartQty > 0 ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-[#1B4D2E]">
                                In cart: {inCartQty}
                              </span>
                              <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#D9D3C7] rounded-full p-0.5">
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs text-[#163E24] hover:bg-[#EDE9E1] active:bg-[#D9D3C7] cursor-pointer transition-colors"
                                  onClick={() => {
                                    const item = cart.items.find((i) => i.productId === product.id);
                                    if (item) cart.setQty(item.key, item.quantity - 1);
                                  }}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-xs font-bold min-w-5 text-center px-1">{inCartQty}</span>
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs text-[#163E24] hover:bg-[#EDE9E1] active:bg-[#D9D3C7] cursor-pointer transition-colors"
                                  onClick={() => {
                                    const item = cart.items.find((i) => i.productId === product.id);
                                    if (item) cart.setQty(item.key, item.quantity + 1);
                                  }}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                cart.add({
                                  productId: product.id,
                                  name: product.name,
                                  unitPrice: Number(product.price),
                                  quantity: 1,
                                  modifiers: [],
                                });
                                toast.success(`Added ${product.name} to cart.`);
                              }}
                              className="w-full rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white text-xs font-bold h-9 shadow-2xs cursor-pointer active:scale-98 transition-transform"
                            >
                              Add to Cart +
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CART REVIEW & ORDERING */}
        {tab === "cart" && (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl font-bold text-[#163E24]">
                Your Table Cart
              </h2>
              <button
                onClick={() => setTab("menu")}
                className="text-xs font-bold text-[#1B4D2E] hover:underline"
              >
                + Add more items
              </button>
            </div>

            {cart.items.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D5] shadow-2xs">
                <ShoppingBag className="w-12 h-12 text-[#8E998B] mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-[#163E24]">Your cart is empty</h3>
                <p className="text-xs text-[#5D665A] mt-1 mb-5">
                  Browse our fresh smoothies, protein bowls, and healthy plates to start.
                </p>
                <Button
                  onClick={() => setTab("menu")}
                  className="rounded-full bg-[#1B4D2E] text-white text-xs font-bold px-6 py-2.5"
                >
                  Explore Menu
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items List */}
                <div className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-2xs space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between pb-4 border-b border-[#F0EBE1] last:border-0 last:pb-0 gap-3"
                    >
                      <div className="flex-1">
                        <p className="font-serif font-bold text-sm text-[#163E24]">{item.name}</p>
                        {item.modifiers.length > 0 && (
                          <p className="text-[11px] text-[#6E7B6C] mt-0.5">
                            {item.modifiers.map((m) => m.name).join(", ")}
                          </p>
                        )}
                        <p className="text-xs font-bold text-[#1B4D2E] mt-1">
                          {inr(item.unitPrice * item.quantity)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-full border border-[#D9D3C7] bg-[#FAF8F5] p-0.5">
                          <button
                            onClick={() => cart.setQty(item.key, item.quantity - 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-[#EDE9E1] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-2">{item.quantity}</span>
                          <button
                            onClick={() => cart.setQty(item.key, item.quantity + 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-[#EDE9E1] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => cart.remove(item.key)}
                          className="text-[#8E998B] hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Customer Info & Notes */}
                <div className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-2xs space-y-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#1B4D2E] block">
                    Order Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#5D665A] block mb-1">
                        Your Name (Optional)
                      </label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Rahul"
                        className="rounded-xl border-[#E8E2D5] text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#5D665A] block mb-1">
                        Phone / WhatsApp (Optional)
                      </label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="For bill & updates"
                        className="rounded-xl border-[#E8E2D5] text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#5D665A] block mb-1">
                      Cooking Instructions / Notes
                    </label>
                    <Textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Less spicy, dressing on the side, allergies..."
                      className="rounded-xl border-[#E8E2D5] text-xs resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-2xs space-y-2">
                  <div className="flex justify-between text-xs text-[#5D665A]">
                    <span>Item Subtotal</span>
                    <span>{inr(cart.subtotal)}</span>
                  </div>
                  {taxPercent > 0 && (
                    <div className="flex justify-between text-xs text-[#5D665A]">
                      <span>{taxName} ({taxPercent}%)</span>
                      <span>{inr(cartTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-serif font-bold text-[#163E24] pt-2 border-t border-[#F0EBE1]">
                    <span>Total Amount</span>
                    <span>{inr(cartTotal)}</span>
                  </div>
                </div>

                {/* Place Order CTA Button */}
                <Button
                  size="lg"
                  disabled={placeOrderMutation.isPending}
                  onClick={() => placeOrderMutation.mutate()}
                  className="w-full rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white text-sm font-bold py-4 shadow-md"
                >
                  {placeOrderMutation.isPending ? (
                    <span>Sending to Kitchen...</span>
                  ) : (
                    <span>Place Order to Kitchen • {inr(cartTotal)}</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS & PAYMENT */}
        {tab === "orders" && (
          <div className="max-w-xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-[#163E24]">
                Table Orders & Status
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["session-state"] })}
                className="rounded-full text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>

            {!hasActiveOrders ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D5] shadow-2xs">
                <Clock className="w-12 h-12 text-[#8E998B] mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-[#163E24]">No active orders</h3>
                <p className="text-xs text-[#5D665A] mt-1 mb-5">
                  Items you order for {table?.name ?? slug} will appear here with live kitchen status.
                </p>
                <Button
                  onClick={() => setTab("menu")}
                  className="rounded-full bg-[#1B4D2E] text-white text-xs font-bold px-6 py-2.5"
                >
                  Browse Menu & Order
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Orders List */}
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-5 border border-[#E8E2D5] shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-serif font-bold text-base text-[#163E24]">
                          {order.order_number}
                        </span>
                        <span className="text-[11px] text-[#7A8578] block">
                          Placed at {istTime(order.created_at)}
                        </span>
                      </div>
                      <Badge className="bg-[#EAF2EC] text-[#1B4D2E] border-[#CDE1D2]">
                        {statusLabel[order.status] || order.status}
                      </Badge>
                    </div>

                    {/* Progress Step Indicator */}
                    <div className="pt-1.5 pb-2">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        {ORDER_FLOW.map((step, idx) => {
                          const currentIdx = ORDER_FLOW.indexOf(order.status as any);
                          const isDone = currentIdx >= 0 && idx <= currentIdx;
                          const isCurrent = currentIdx === idx;
                          return (
                            <div key={step} className="flex-1 flex flex-col items-center">
                              <div
                                className={`h-1.5 w-full rounded-full transition-all ${
                                  isDone ? "bg-[#1B4D2E]" : "bg-[#EDE9E1]"
                                } ${isCurrent ? "ring-2 ring-[#88B04B]/60" : ""}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#7A8578] font-semibold uppercase px-0.5">
                        <span className="text-[#1B4D2E]">Placed</span>
                        <span className="text-[#163E24] font-bold bg-[#EAF2EC] px-2 py-0.5 rounded-md text-[9px] tracking-wide">
                          {statusLabel[order.status] || order.status}
                        </span>
                        <span className={order.status === "COMPLETED" ? "text-[#1B4D2E]" : "text-[#A1A89F]"}>Served</span>
                      </div>
                    </div>

                    {/* Item list */}
                    <div className="border-t border-[#F0EBE1] pt-3 space-y-1.5">
                      {(order.items ?? []).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-[#4F584C]">
                          <span>
                            {item.quantity}× {item.name || item.product_name}
                          </span>
                          <span className="font-semibold">{inr(Number(item.line_total))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Table Bill & Payment Card */}
                <div className="bg-[#163E24] text-white rounded-3xl p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#88B04B] block">
                        TABLE BILL
                      </span>
                      <h3 className="font-serif text-2xl font-bold text-white">
                        {inr(billTotal)}
                      </h3>
                    </div>
                    {isPaid ? (
                      <Badge className="bg-[#88B04B] text-[#163E24] font-bold">
                        PAID ✓
                      </Badge>
                    ) : (
                      <Badge className="bg-white/20 text-white">
                        PAYMENT PENDING
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {!isPaid ? (
                      <Button
                        onClick={() => setShowPaymentModal(true)}
                        className="flex-1 rounded-full bg-[#88B04B] hover:bg-[#7aa042] text-[#163E24] font-bold text-xs py-3"
                      >
                        <Banknote className="w-4 h-4 mr-1.5" />
                        <span>Pay Bill ({inr(billTotal)})</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowInvoice(true)}
                        className="flex-1 rounded-full bg-white text-[#163E24] hover:bg-[#EDE9E1] font-bold text-xs py-3"
                      >
                        <ReceiptText className="w-4 h-4 mr-1.5" />
                        <span>View Tax Invoice</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (if in Menu tab and cart has items) */}
      {tab === "menu" && cart.items.length > 0 && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:bottom-18 left-0 right-0 z-30 px-3 sm:px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => setTab("cart")}
              className="w-full bg-[#1B4D2E] active:bg-[#143B23] text-white rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between transition-all group cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
                  {cart.count}
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-bold leading-tight">View Cart</p>
                  <p className="text-[10px] text-white/80">Table: {table ? table.name : slug.replace("-", " ").toUpperCase()}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold">
                <span>{inr(cartTotal)}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D5] pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-md mx-auto px-4 sm:px-6 flex items-center justify-around">
          <button
            onClick={() => setTab("menu")}
            className={`flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer active:scale-95 transition-transform ${
              tab === "menu" ? "text-[#1B4D2E] font-bold" : "text-[#7A8578] font-medium"
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[11px]">Menu</span>
          </button>

          <button
            onClick={() => setTab("cart")}
            className={`relative flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer active:scale-95 transition-transform ${
              tab === "cart" ? "text-[#1B4D2E] font-bold" : "text-[#7A8578] font-medium"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.count > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-[#1B4D2E] text-white text-[10px] font-bold flex items-center justify-center">
                {cart.count}
              </span>
            )}
            <span className="text-[11px]">Cart</span>
          </button>

          <button
            onClick={() => setTab("orders")}
            className={`relative flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer active:scale-95 transition-transform ${
              tab === "orders" ? "text-[#1B4D2E] font-bold" : "text-[#7A8578] font-medium"
            }`}
          >
            <Clock className="w-5 h-5" />
            {hasActiveOrders && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            )}
            <span className="text-[11px]">Orders</span>
          </button>

          <Link
            to="/home"
            className="flex flex-col items-center gap-0.5 py-1 text-xs text-[#7A8578] hover:text-[#163E24] font-medium active:scale-95 transition-transform"
          >
            <Info className="w-5 h-5" />
            <span className="text-[11px]">About</span>
          </Link>
        </div>
      </nav>

      {/* Product Customization Dialog */}
      <ProductDialog
        product={selected}
        groups={selected ? modifierGroups[selected.id] ?? [] : []}
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
            modifiers,
            ...(notes ? { notes } : {}),
          });
          setSelected(null);
          toast.success(`Added ${selected.name} to cart.`);
        }}
      />

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <Dialog open onOpenChange={() => setShowPaymentModal(false)}>
          <DialogContent className="max-w-sm bg-[#FAF8F5] border-[#E8E2D5] rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-[#163E24]">
                Choose Payment Method
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-[#5D665A] mb-4">
              Total bill for {table?.name ?? slug}: <strong className="text-[#163E24]">{inr(billTotal)}</strong>
            </p>

            <div className="space-y-3">
              {/* Online Option */}
              <button
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate("ONLINE")}
                className="w-full p-4 rounded-2xl bg-white border border-[#E8E2D5] hover:border-[#1B4D2E] hover:bg-[#EAF2EC] text-left flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2EC] text-[#1B4D2E] flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-sm text-[#163E24]">Pay Online (UPI / Card)</p>
                    <p className="text-[10px] text-[#7A8578]">GPay, PhonePe, Paytm, Cards via Razorpay</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#1B4D2E] group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Cash at counter */}
              <button
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate("CASH")}
                className="w-full p-4 rounded-2xl bg-white border border-[#E8E2D5] hover:border-[#1B4D2E] hover:bg-[#EAF2EC] text-left flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE9E1] text-[#163E24] flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-sm text-[#163E24]">Pay Cash at Counter</p>
                    <p className="text-[10px] text-[#7A8578]">Pay with Cash or Counter QR scanner</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#1B4D2E] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Tax Invoice Modal */}
      {showInvoice && state?.bill && (
        <Dialog open onOpenChange={() => setShowInvoice(false)}>
          <DialogContent className="max-w-md bg-white border-[#E8E2D5] rounded-3xl p-6">
            <TaxInvoiceReceipt
              bill={state.bill}
              orders={state.orders}
              table={state.session?.table}
              cafe={menu?.cafe}
              tax={menu?.tax}
              onClose={() => setShowInvoice(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
