import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Bell,
  Utensils,
  Sparkles,
  RefreshCw,
  XCircle,
  UtensilsCrossed,
  Search,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getKitchenOrders, updateOrderStatus, getLists, setProductStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inr, istTime } from "@/lib/format";
import { playNewOrderTing } from "@/lib/sounds";

export const Route = createFileRoute("/_authenticated/admin/kitchen")({
  component: KitchenDisplayPage,
});

type KitchenOrder = {
  id: string;
  order_number: string;
  table_id: string;
  status: "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
  total: number | string;
  notes?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  created_at: string;
  cafe_tables?: { name: string } | null;
  table_sessions?: { code: string; payment_state: string } | null;
  order_items?: {
    id: string;
    product_name: string;
    quantity: number;
    notes?: string | null;
    line_total: number | string;
  }[];
};

function KitchenDisplayPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("ALL");
  const [cancelModalOrder, setCancelModalOrder] = useState<KitchenOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [dishSearch, setDishSearch] = useState("");
  const [dishCat, setDishCat] = useState("ALL");
  const [now, setNow] = useState(Date.now());

  // 1-second heartbeat timer for 8-min countdown and live auto-advancement
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kitchenFn = useServerFn(getKitchenOrders);
  const updateStatusFn = useServerFn(updateOrderStatus);
  const listsFn = useServerFn(getLists);
  const setProductStatusFn = useServerFn(setProductStatus);

  const kitchenQuery = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: () => kitchenFn(),
    refetchInterval: 5000,
  });

  const listsQuery = useQuery({
    queryKey: ["admin-lists"],
    queryFn: () => listsFn(),
    enabled: isAvailabilityOpen,
  });

  // Realtime subscription on orders + sound alert for new orders
  useEffect(() => {
    const channel = supabase
      .channel("kitchen-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
        if (payload.eventType === "INSERT") {
          playNewOrderTing();
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: async (vars: {
      orderId: string;
      status: "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
      reason?: string;
    }) => {
      return await updateStatusFn({ data: vars });
    },
    onSuccess: (_, vars) => {
      toast.success(`Order updated to ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      setCancelModalOrder(null);
      setCancelReason("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update order status");
    },
  });

  const productStatusMutation = useMutation({
    mutationFn: async (vars: { id: string; status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN" }) => {
      return await setProductStatusFn({ data: vars });
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "OUT_OF_STOCK"
          ? "Dish marked Out of Stock"
          : vars.status === "AVAILABLE"
          ? "Dish marked Available"
          : "Dish status updated",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-lists"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update dish status"),
  });

  const rawOrders = (kitchenQuery.data ?? []) as unknown as KitchenOrder[];

  // Auto-progression client-side trigger (5s -> ACCEPTED, 210s -> PREPARING)
  useEffect(() => {
    if (!rawOrders || rawOrders.length === 0 || updateMutation.isPending) return;
    const current = Date.now();
    for (const o of rawOrders) {
      const elapsed = current - new Date(o.created_at).getTime();
      if (o.status === "PLACED" && elapsed >= 5000) {
        updateMutation.mutate({ orderId: o.id, status: "ACCEPTED" });
        break;
      }
      if (o.status === "ACCEPTED" && elapsed >= 210000) {
        updateMutation.mutate({ orderId: o.id, status: "PREPARING" });
        break;
      }
    }
  }, [now, rawOrders, updateMutation.isPending]);

  const orders = rawOrders.filter((o) => {
    if (filter === "ALL") return true;
    return o.status === filter;
  });

  const allProducts = listsQuery.data?.products ?? [];
  const outOfStockCount = allProducts.filter((p: any) => p.status === "OUT_OF_STOCK").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLACED":
        return <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-bold animate-pulse">NEW ORDER</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-medium">ACCEPTED</Badge>;
      case "PREPARING":
        return <Badge className="bg-purple-600 hover:bg-purple-600 text-white font-medium">PREPARING</Badge>;
      case "READY":
        return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold">READY TO SERVE</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getElapsedTime = (iso: string) => {
    const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return "Just now";
    if (mins === 1) return "1 min ago";
    return `${mins} mins ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-emerald-600" />
            Kitchen Display System (KDS)
          </h1>
          <p className="text-sm text-muted-foreground">
            Live food prep queue with real-time order status updates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAvailabilityOpen(true)}
            className="border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-semibold"
          >
            <UtensilsCrossed className="mr-1.5 h-4 w-4 text-emerald-600" />
            Dish Availability
            {outOfStockCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {outOfStockCount} Out
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => kitchenQuery.refetch()}
            disabled={kitchenQuery.isFetching}
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${kitchenQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Live Sync Active
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
          className="gap-1.5"
        >
          All Active
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
            {rawOrders.length}
          </Badge>
        </Button>
        <Button
          size="sm"
          variant={filter === "PLACED" ? "default" : "outline"}
          onClick={() => setFilter("PLACED")}
          className="gap-1.5"
        >
          New ({rawOrders.filter((o) => o.status === "PLACED").length})
        </Button>
        <Button
          size="sm"
          variant={filter === "ACCEPTED" ? "default" : "outline"}
          onClick={() => setFilter("ACCEPTED")}
          className="gap-1.5"
        >
          Accepted ({rawOrders.filter((o) => o.status === "ACCEPTED").length})
        </Button>
        <Button
          size="sm"
          variant={filter === "PREPARING" ? "default" : "outline"}
          onClick={() => setFilter("PREPARING")}
          className="gap-1.5"
        >
          Preparing ({rawOrders.filter((o) => o.status === "PREPARING").length})
        </Button>
        <Button
          size="sm"
          variant={filter === "READY" ? "default" : "outline"}
          onClick={() => setFilter("READY")}
          className="gap-1.5"
        >
          Ready ({rawOrders.filter((o) => o.status === "READY").length})
        </Button>
      </div>

      {/* Orders Grid */}
      {kitchenQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed py-12 text-center bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-semibold">Kitchen Queue Is Clear!</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              There are no orders waiting in the kitchen right now. As soon as a customer orders, it will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => {
            const isNew = order.status === "PLACED";
            const isPrep = order.status === "PREPARING";
            const isReady = order.status === "READY";

            const elapsedSecs = Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 1000));
            const remainingSecs = 480 - elapsedSecs; // 8 minutes countdown
            const isOverdue = remainingSecs < 0;
            const displayMins = Math.floor(Math.abs(remainingSecs) / 60);
            const displaySecs = Math.abs(remainingSecs) % 60;
            const timeBadgeText = isOverdue
              ? `+${displayMins}m ${displaySecs}s overdue`
              : `${displayMins}m ${String(displaySecs).padStart(2, "0")}s left`;

            return (
              <Card
                key={order.id}
                className={`flex flex-col justify-between overflow-hidden border-2 transition-all shadow-sm ${
                  isNew
                    ? "border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/10"
                    : isReady
                    ? "border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : isPrep
                    ? "border-purple-500/60"
                    : "border-border"
                }`}
              >
                {/* Card Top */}
                <div>
                  <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/40 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-base font-bold text-foreground">
                          {order.order_number}
                        </span>
                        {getStatusBadge(order.status)}
                        {order.table_sessions?.payment_state === "PAID" || order.table_sessions?.payment_state === "CASH_PAID" ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] py-0 px-1.5 font-semibold">
                            PAID ✓
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40 text-[10px] py-0 px-1.5 font-medium">
                            UNPAID
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-display text-lg font-extrabold text-foreground mt-0.5">
                        {order.cafe_tables?.name ?? "Dine-In Table"}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center justify-end gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                          isOverdue
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 animate-pulse"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{timeBadgeText}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Placed {getElapsedTime(order.created_at)} ({istTime(order.created_at)})
                      </span>
                    </div>
                  </CardHeader>

                  {/* Itemized Dishes */}
                  <CardContent className="p-4 space-y-3">
                    <div className="divide-y divide-border/60">
                      {(order.order_items ?? []).map((item) => (
                        <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                {item.quantity}×
                              </span>
                              <span className="font-semibold text-foreground text-sm">
                                {item.product_name}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 pl-7">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>

                          <span className="font-mono text-xs text-muted-foreground">
                            {inr(item.line_total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                        <strong className="block mb-0.5 font-bold">Special Instructions:</strong>
                        {order.notes}
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Card Action Buttons: ONLY Ready and Served needed */}
                <div className="p-4 pt-0 border-t border-border/40 mt-2 bg-muted/20">
                  <div className="flex gap-2 pt-3 items-center">
                    {order.status === "PLACED" && (
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5 animate-pulse">
                          <Clock className="h-3.5 w-3.5 animate-spin text-amber-600" />
                          Auto-accepting (5s)...
                        </span>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0"
                          onClick={() => updateMutation.mutate({ orderId: order.id, status: "READY" })}
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark as Ready
                        </Button>
                      </div>
                    )}

                    {order.status === "ACCEPTED" && (
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <span className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                          Auto-prep in ~3m...
                        </span>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0"
                          onClick={() => updateMutation.mutate({ orderId: order.id, status: "READY" })}
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark as Ready
                        </Button>
                      </div>
                    )}

                    {order.status === "PREPARING" && (
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() =>
                          updateMutation.mutate({ orderId: order.id, status: "READY" })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark as Ready
                      </Button>
                    )}

                    {order.status === "READY" && (
                      <Button
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                        onClick={() =>
                          updateMutation.mutate({ orderId: order.id, status: "SERVED" })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <Utensils className="mr-1.5 h-4 w-4" /> Served to Table
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:border-destructive shrink-0"
                      onClick={() => setCancelModalOrder(order)}
                      disabled={updateMutation.isPending}
                      title="Cancel Order"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Order Dialog */}
      <Dialog open={Boolean(cancelModalOrder)} onOpenChange={(open) => !open && setCancelModalOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Cancel Order {cancelModalOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this order from{" "}
              <strong>{cancelModalOrder?.cafe_tables?.name}</strong>? Please enter a reason.
            </p>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Out of ingredients, customer requested cancel"
              className="text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCancelModalOrder(null)}>
                Back
              </Button>
              <Button
                variant="destructive"
                disabled={!cancelReason.trim() || updateMutation.isPending}
                onClick={() => {
                  if (!cancelModalOrder) return;
                  updateMutation.mutate({
                    orderId: cancelModalOrder.id,
                    status: "CANCELLED",
                    reason: cancelReason.trim(),
                  });
                }}
              >
                Confirm Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dish Availability (86 / Out of Stock) Dialog */}
      <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-serif">
              <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
              Manage Dish Availability (Kitchen & Bar)
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Mark items Out of Stock when ingredients run out. Dishes marked Out of Stock will immediately be disabled on all customer menus.
          </p>

          <div className="flex gap-2 items-center pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dish by name..."
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              <Button
                size="sm"
                variant={dishCat === "ALL" ? "default" : "outline"}
                onClick={() => setDishCat("ALL")}
                className="text-xs h-9 px-3"
              >
                All
              </Button>
              {(listsQuery.data?.categories ?? []).map((cat: any) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={dishCat === cat.id ? "default" : "outline"}
                  onClick={() => setDishCat(cat.id)}
                  className="text-xs h-9 px-3 shrink-0"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Dish list */}
          <div className="overflow-y-auto flex-1 divide-y divide-border/60 mt-3 pr-1 max-h-96">
            {listsQuery.isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading dishes...</div>
            ) : (
              (listsQuery.data?.products ?? [])
                .filter((p: any) => {
                  if (p.status === "HIDDEN") return false;
                  if (dishCat !== "ALL" && p.category_id !== dishCat) return false;
                  if (!dishSearch.trim()) return true;
                  return p.name.toLowerCase().includes(dishSearch.toLowerCase());
                })
                .map((prod: any) => {
                  const isOut = prod.status === "OUT_OF_STOCK";
                  return (
                    <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{prod.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{inr(prod.price)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isOut ? (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                              Out of Stock (86)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5">
                              Available
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isOut ? "default" : "outline"}
                        className={
                          isOut
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                            : "border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs h-8 px-3"
                        }
                        disabled={productStatusMutation.isPending}
                        onClick={() =>
                          productStatusMutation.mutate({
                            id: prod.id,
                            status: isOut ? "AVAILABLE" : "OUT_OF_STOCK",
                          })
                        }
                      >
                        {isOut ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" /> Mark In Stock
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Mark Out of Stock
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
