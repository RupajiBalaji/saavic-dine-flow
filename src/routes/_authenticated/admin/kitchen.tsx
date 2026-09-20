import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getKitchenOrders, updateOrderStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inr, istTime } from "@/lib/format";

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

  const kitchenFn = useServerFn(getKitchenOrders);
  const updateStatusFn = useServerFn(updateOrderStatus);

  const kitchenQuery = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: () => kitchenFn(),
    refetchInterval: 8000,
  });

  // Realtime subscription on orders
  useEffect(() => {
    const channel = supabase
      .channel("kitchen-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
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

  const rawOrders = (kitchenQuery.data ?? []) as unknown as KitchenOrder[];

  const orders = rawOrders.filter((o) => {
    if (filter === "ALL") return true;
    return o.status === filter;
  });

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

        <div className="flex items-center gap-2">
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
                      <div className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{getElapsedTime(order.created_at)}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{istTime(order.created_at)}</span>
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

                {/* Card Action Buttons */}
                <div className="p-4 pt-0 border-t border-border/40 mt-2 bg-muted/20">
                  <div className="flex gap-2 pt-3">
                    {order.status === "PLACED" && (
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        onClick={() =>
                          updateMutation.mutate({ orderId: order.id, status: "ACCEPTED" })
                        }
                        disabled={updateMutation.isPending}
                      >
                        Accept Order
                      </Button>
                    )}

                    {order.status === "ACCEPTED" && (
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                        onClick={() =>
                          updateMutation.mutate({ orderId: order.id, status: "PREPARING" })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <Play className="mr-1.5 h-4 w-4" /> Start Preparing
                      </Button>
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
                      className="text-muted-foreground hover:text-destructive hover:border-destructive"
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
    </div>
  );
}
