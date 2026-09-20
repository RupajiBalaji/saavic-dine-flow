import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ReceiptText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  XCircle,
  Printer,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { listOrders } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inr, istDateTime, istTime, statusLabel } from "@/lib/format";
import { printReceipt } from "@/lib/print";
import { TaxInvoiceReceipt } from "@/components/TaxInvoiceReceipt";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersManagementPage,
});

type OrderItem = {
  id: string;
  order_number: string;
  session_id: string;
  table_id: string;
  status: "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
  subtotal: number | string;
  tax_amount: number | string;
  total: number | string;
  discount_amount?: number | string | null;
  notes?: string | null;
  cancel_reason?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  created_at: string;
  cafe_tables?: { name: string; slug: string } | null;
  table_sessions?: { code: string; payment_state: string } | null;
  order_items?: {
    id: string;
    product_name: string;
    quantity: number;
    notes?: string | null;
    line_total: number | string;
  }[];
};

function OrdersManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const listFn = useServerFn(listOrders);

  const ordersQuery = useQuery({
    queryKey: ["admin-orders-list", statusFilter],
    queryFn: () => listFn({ data: { status: statusFilter === "ALL" ? undefined : statusFilter } }),
    refetchInterval: 10000,
  });

  // Realtime subscription on orders
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-orders-list"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const rawOrders = (ordersQuery.data ?? []) as unknown as OrderItem[];

  const filteredOrders = rawOrders.filter((order) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const matchesNumber = order.order_number.toLowerCase().includes(term);
    const matchesTable = (order.cafe_tables?.name ?? "").toLowerCase().includes(term);
    const matchesSession = (order.table_sessions?.code ?? "").toLowerCase().includes(term);
    const matchesItems = (order.order_items ?? []).some((item) =>
      item.product_name.toLowerCase().includes(term),
    );
    return matchesNumber || matchesTable || matchesSession || matchesItems;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLACED":
        return <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-semibold">PLACED</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-blue-600 hover:bg-blue-600 text-white">ACCEPTED</Badge>;
      case "PREPARING":
        return <Badge className="bg-purple-600 hover:bg-purple-600 text-white">PREPARING</Badge>;
      case "READY":
        return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold">READY</Badge>;
      case "SERVED":
        return <Badge className="bg-teal-700 hover:bg-teal-700 text-white">SERVED</Badge>;
      case "COMPLETED":
        return <Badge className="bg-slate-700 hover:bg-slate-700 text-white">COMPLETED</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentState?: string) => {
    if (paymentState === "PAID" || paymentState === "CASH_PAID") {
      return <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 border-emerald-500/30">PAID ✓</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-500/30">UNPAID</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ReceiptText className="h-7 w-7 text-emerald-600" />
            Orders Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete audit trail of all dining orders, dishes, and status transitions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => ordersQuery.refetch()}
          disabled={ordersQuery.isFetching}
        >
          <RefreshCw className={`mr-1.5 h-4 w-4 ${ordersQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh Orders
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-muted/30 border-border/80">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, table name, or dish..."
              className="pl-9 bg-background text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["ALL", "PLACED", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"].map((st) => (
              <Button
                key={st}
                size="sm"
                variant={statusFilter === st ? "default" : "outline"}
                onClick={() => setStatusFilter(st)}
                className="h-8 text-xs font-medium"
              >
                {st === "ALL" ? "All Orders" : st}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {ordersQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed py-12 text-center bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <ReceiptText className="h-8 w-8 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">No Orders Found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "No orders match your search criteria." : "No orders placed in this category yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Time (IST)</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {order.cafe_tables?.name ?? "Table"}
                      {order.table_sessions?.code && (
                        <span className="block font-mono text-[11px] text-muted-foreground font-normal">
                          Session {order.table_sessions.code}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {istDateTime(order.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-foreground max-w-xs">
                      {(order.order_items ?? [])
                        .map((i) => `${i.quantity}× ${i.product_name}`)
                        .join(", ")}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-right text-foreground">
                      {inr(order.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getPaymentBadge(order.table_sessions?.payment_state)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
          {selectedOrder && (
            <div>
              <TaxInvoiceReceipt
                tableName={selectedOrder.cafe_tables?.name ?? "Table"}
                sessionCode={selectedOrder.table_sessions?.code}
                customerName={selectedOrder.customer_name}
                customerPhone={selectedOrder.customer_phone}
                dateTime={istDateTime(selectedOrder.created_at)}
                invoiceNumber={`ORD-${selectedOrder.order_number}`}
                isPaid={["PAID", "CASH_PAID"].includes(selectedOrder.table_sessions?.payment_state ?? "")}
                paymentMode={selectedOrder.table_sessions?.payment_state?.toLowerCase() ?? "unpaid"}
                items={(selectedOrder.order_items ?? []).map((item: any) => ({
                  id: item.id,
                  name: item.product_name,
                  quantity: Number(item.quantity),
                  unitPrice: item.unit_price !== undefined ? Number(item.unit_price) : undefined,
                  lineTotal: Number(item.line_total),
                  notes: item.notes ?? undefined,
                }))}
                subtotal={Number(selectedOrder.subtotal ?? 0)}
                taxAmount={Number(selectedOrder.tax_amount ?? 0)}
                cgstAmount={Math.round((Number(selectedOrder.tax_amount ?? 0) / 2) * 100) / 100}
                sgstAmount={
                  Math.round(
                    (Number(selectedOrder.tax_amount ?? 0) -
                      Math.round((Number(selectedOrder.tax_amount ?? 0) / 2) * 100) / 100) *
                      100
                  ) / 100
                }
                total={Number(selectedOrder.total ?? 0)}
              />

              {selectedOrder.notes && (
                <div className="mx-6 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <strong className="block mb-0.5 font-bold">Kitchen/Order Note:</strong>
                  {selectedOrder.notes}
                </div>
              )}

              {selectedOrder.cancel_reason && (
                <div className="mx-6 mb-3 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                  <strong className="block mb-0.5 font-bold">Cancellation Reason:</strong>
                  {selectedOrder.cancel_reason}
                </div>
              )}

              {/* Action buttons (hidden on print) */}
              <div className="p-4 bg-muted/40 border-t border-border flex gap-3 no-print">
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() =>
                    printReceipt("printable-invoice", `Order Receipt - ${selectedOrder.order_number}`)
                  }
                >
                  <Printer className="h-4 w-4" /> Print Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
