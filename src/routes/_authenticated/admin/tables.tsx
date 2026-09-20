import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Grid3x3,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  ReceiptText,
  X,
  Printer,
  Timer,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getManagerTableFeed, markCashPaid, closeTable } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { inr, istTime, statusLabel } from "@/lib/format";
import { printReceipt } from "@/lib/print";
import { TaxInvoiceReceipt } from "@/components/TaxInvoiceReceipt";

export const Route = createFileRoute("/_authenticated/admin/tables")({
  component: TablesPage,
});

function TablesPage() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [invoiceTable, setInvoiceTable] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [refNumber, setRefNumber] = useState<string>("");

  const feedFn = useServerFn(getManagerTableFeed);
  const markCashFn = useServerFn(markCashPaid);
  const closeTableFn = useServerFn(closeTable);

  const feedQuery = useQuery({
    queryKey: ["manager-table-feed"],
    queryFn: () => feedFn(),
    refetchInterval: 15000,
  });

  // Realtime updates for tables and orders
  useEffect(() => {
    const channel = supabase
      .channel("tables-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["manager-table-feed"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cafe_tables" }, () => {
        queryClient.invalidateQueries({ queryKey: ["manager-table-feed"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "table_sessions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["manager-table-feed"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const recordPaymentMutation = useMutation({
    mutationFn: async ({
      sessionId,
      method,
      referenceNumber,
    }: {
      sessionId: string;
      method?: "CASH" | "UPI" | "CARD";
      referenceNumber?: string;
    }) => {
      return await markCashFn({ data: { sessionId, method, referenceNumber } });
    },
    onSuccess: (res: any) => {
      toast.success(`Payment recorded! Txn: ${res.transactionId}`);
      queryClient.invalidateQueries({ queryKey: ["manager-table-feed"] });
      const updatedDetails = {
        transactionId: res.transactionId,
        paidAt: new Date().toISOString(),
        method: paymentMethod,
        provider: paymentMethod,
        amount: selectedTable?.billTotal ?? 0,
      };
      if (selectedTable) {
        const updated = {
          ...selectedTable,
          isPaid: true,
          paidDetails: updatedDetails,
        };
        setSelectedTable(updated);
        setInvoiceTable(updated);
      }
    },
    onError: (err: Error) => toast.error(err.message || "Failed to record payment."),
  });

  const closeTableMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await closeTableFn({ data: { sessionId } });
    },
    onSuccess: () => {
      toast.success("Table session closed and marked Available.");
      queryClient.invalidateQueries({ queryKey: ["manager-table-feed"] });
      setSelectedTable(null);
    },
    onError: (err: Error) => toast.error(err.message || "Cannot close table yet."),
  });

  const printBill = (table: any) => {
    setInvoiceTable(table);
  };

  const tables = feedQuery.data?.tables ?? [];
  const recentPayments = feedQuery.data?.recentPayments ?? [];

  const occupiedCount = tables.filter((t) => t.session != null).length;
  const unpaidCount = tables.filter((t) => t.session != null && !t.isPaid).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl">Live Tables & Bills</h1>
          <p className="text-sm text-muted-foreground">
            Real-time floor map, live table billing, and recent payments.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {tables.length - occupiedCount} Available
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            {occupiedCount} Occupied
          </span>
          {unpaidCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unpaidCount} Bill Pending
            </Badge>
          )}
        </div>
      </div>

      {/* 20 Table Visual Grid */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Floor Plan (Tables 01 – 20)</h2>

        {feedQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {tables.map((table) => {
              const hasSession = Boolean(table.session);
              const isPaid = table.isPaid;
              const isUnpaid = hasSession && !isPaid;

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => {
                    setSelectedTable(table);
                    setPaymentMethod("CASH");
                    setRefNumber("");
                  }}
                  className={`surface-card flex flex-col justify-between p-3.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isUnpaid
                      ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30"
                      : isPaid
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "opacity-85"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="font-display text-base font-semibold">{table.name}</p>
                      <p className="text-[10px] text-muted-foreground">Cap: {table.capacity} diners</p>
                    </div>
                    <Badge
                      variant={isUnpaid ? "destructive" : isPaid ? "secondary" : "outline"}
                      className={`text-[9px] px-1.5 py-0 uppercase ${
                        isPaid ? "bg-emerald-600 text-white font-semibold hover:bg-emerald-600" : ""
                      }`}
                    >
                      {isPaid ? "PAID" : isUnpaid ? "UNPAID" : "FREE"}
                    </Badge>
                  </div>

                  <div className="mt-3 border-t border-border/40 pt-2 text-xs">
                    {hasSession ? (
                      <div>
                        <div className="flex items-baseline justify-between">
                          <p className="font-bold text-primary">{inr(table.billTotal)}</p>
                          <p className="text-[10px] text-muted-foreground">{table.orderCount} orders</p>
                        </div>
                        {isPaid && table.paidDetails && (
                          <div className="mt-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-[10px] text-emerald-700 dark:text-emerald-400">
                            <p className="font-mono font-bold truncate">Txn: {table.paidDetails.transactionId}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {istTime(table.paidDetails.paidAt)} • {table.paidDetails.method}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Available</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Payments Feed (Last 2 Hours strictly for Manager) */}
      <section className="surface-card p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">Recent Payments (Last 2 Hours)</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Manager feed restricted to the current 2-hour rolling window. Full reports are available to the Super Admin.
            </p>
          </div>

          <Badge variant="outline" className="text-xs self-start sm:self-auto">
            Rolling Window: 2h
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
              <p>No payments recorded in the last 2 hours.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 font-medium">Table</th>
                  <th className="pb-2 font-medium">Transaction ID</th>
                  <th className="pb-2 font-medium">Payment Time (IST)</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Session Code</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="py-2.5 font-semibold text-foreground">{p.tableName}</td>
                    <td className="py-2.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {p.transactionId}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{istTime(p.createdAt)}</td>
                    <td className="py-2.5">
                      <Badge variant={p.provider === "CASH" ? "outline" : "secondary"} className="text-[10px]">
                        {p.provider === "CASH"
                          ? "Cash at Counter"
                          : p.provider === "UPI"
                          ? "UPI QR"
                          : p.provider === "CARD"
                          ? "Card POS"
                          : "Razorpay Online"}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-muted-foreground font-mono">{p.sessionCode}</td>
                    <td className="py-2.5 text-right font-bold text-primary">{inr(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Table Detail / Settle Bill Modal */}
      <Dialog open={Boolean(selectedTable)} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="max-w-md">
          {selectedTable && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-display text-xl">{selectedTable.name}</DialogTitle>
                  <Badge
                    variant={selectedTable.isPaid ? "secondary" : "destructive"}
                    className={selectedTable.isPaid ? "bg-emerald-600 text-white hover:bg-emerald-600" : ""}
                  >
                    {selectedTable.isPaid ? "PAID" : selectedTable.session ? "PAYMENT DUE" : "AVAILABLE"}
                  </Badge>
                </div>
              </DialogHeader>

              {selectedTable.session ? (
                <div className="space-y-3">
                  {/* Paid Details Card */}
                  {selectedTable.isPaid && selectedTable.paidDetails && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Payment Completed
                        </span>
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">PAID</Badge>
                      </div>
                      <div className="space-y-1 border-t border-emerald-500/20 pt-2 text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px]">Transaction ID:</span>
                          <span className="font-mono font-bold text-foreground text-[12px]">
                            {selectedTable.paidDetails.transactionId}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Payment Time (IST):</span>
                          <span className="text-foreground font-medium">{istTime(selectedTable.paidDetails.paidAt)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Payment Method:</span>
                          <span className="font-medium text-foreground">
                            {selectedTable.paidDetails.method} ({selectedTable.paidDetails.provider})
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Amount Paid:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {inr(selectedTable.paidDetails.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-muted/50 p-3 text-xs">
                    <p>
                      <span className="text-muted-foreground">Session Code:</span>{" "}
                      <span className="font-mono font-medium">{selectedTable.session.code}</span>
                    </p>
                    <p className="mt-1">
                      <span className="text-muted-foreground">Opened at:</span>{" "}
                      {istTime(selectedTable.session.opened_at)}
                    </p>
                    {selectedTable.session.customer_name && (
                      <p className="mt-1">
                        <span className="text-muted-foreground">Guest:</span> {selectedTable.session.customer_name}
                      </p>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-border/40 text-xs">
                    <p className="pb-1 font-semibold text-muted-foreground">Orders on this Table:</p>
                    {(selectedTable.orders ?? []).map((o: any) => (
                      <div key={o.id} className="py-2">
                        <div className="flex items-center justify-between font-medium">
                          <span>
                            {o.order_number} ({statusLabel[o.status] || o.status})
                          </span>
                          <span>{inr(o.total)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{o.items.join(", ")}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>Total Bill</span>
                      <span className="text-primary">{inr(selectedTable.billTotal)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {!selectedTable.isPaid && (
                      <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
                        <p className="text-xs font-semibold">Record Payment</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["CASH", "UPI", "CARD"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPaymentMethod(m)}
                              className={`rounded-md border py-1.5 text-xs font-medium transition-colors ${
                                paymentMethod === m
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:bg-muted"
                              }`}
                            >
                              {m === "CASH" ? "Cash" : m === "UPI" ? "UPI QR" : "Card"}
                            </button>
                          ))}
                        </div>
                        {paymentMethod !== "CASH" && (
                          <div className="pt-1">
                            <label className="text-[10px] text-muted-foreground">
                              Reference / UTR # (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder={
                                paymentMethod === "UPI" ? "e.g. 12-digit UTR number" : "e.g. Card Auth / Slip #"
                              }
                              value={refNumber}
                              onChange={(e) => setRefNumber(e.target.value)}
                              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        )}
                        <Button
                          className="w-full mt-2"
                          onClick={() => {
                            const payload: { sessionId: string; method?: "CASH" | "UPI" | "CARD"; referenceNumber?: string } = {
                              sessionId: selectedTable.session.id,
                              method: paymentMethod,
                            };
                            if (refNumber.trim()) payload.referenceNumber = refNumber.trim();
                            recordPaymentMutation.mutate(payload);
                          }}
                          disabled={recordPaymentMutation.isPending}
                        >
                          <IndianRupee className="mr-2 h-4 w-4" /> Record {paymentMethod} Payment ({inr(selectedTable.billTotal)})
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => printBill(selectedTable)}>
                        <Printer className="mr-2 h-4 w-4" /> Print Bill
                      </Button>
                      <Button
                        variant={selectedTable.isPaid ? "default" : "secondary"}
                        className="flex-1"
                        onClick={() => closeTableMutation.mutate(selectedTable.session.id)}
                        disabled={closeTableMutation.isPending || !selectedTable.isPaid}
                      >
                        Close Table
                      </Button>
                    </div>

                    {!selectedTable.isPaid && (
                      <p className="text-center text-[11px] text-muted-foreground">
                        * Bill must be settled (Payment recorded or Online paid) before closing the table.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <p>This table is currently available.</p>
                  <p className="mt-1 text-xs">A new session will start automatically when a diner orders from the QR.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Printable E-Bill / Tax Invoice Dialog */}
      <Dialog open={Boolean(invoiceTable)} onOpenChange={(open) => !open && setInvoiceTable(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
          {invoiceTable && (
            <div>
              <TaxInvoiceReceipt
                cafe={invoiceTable.cafe}
                tableName={invoiceTable.name}
                sessionCode={invoiceTable.session?.code}
                customerName={invoiceTable.session?.customer_name}
                dateTime={
                  invoiceTable.paidDetails?.paidAt
                    ? istTime(invoiceTable.paidDetails.paidAt)
                    : istTime(new Date().toISOString())
                }
                transactionId={invoiceTable.paidDetails?.transactionId}
                isPaid={invoiceTable.isPaid}
                paymentMode={invoiceTable.paidDetails?.method}
                items={
                  invoiceTable.orders?.flatMap((order: any) =>
                    order.order_items && order.order_items.length > 0
                      ? order.order_items.map((item: any) => ({
                          id: item.id,
                          name: item.product_name,
                          quantity: item.quantity,
                          unitPrice: item.unit_price,
                          lineTotal: item.line_total,
                        }))
                      : (order.items ?? []).map((desc: string, i: number) => ({
                          id: `${order.id}-${i}`,
                          name: desc,
                          quantity: 1,
                          lineTotal: order.total,
                        }))
                  ) ?? []
                }
                subtotal={invoiceTable.billSubtotal || invoiceTable.billTotal}
                taxAmount={invoiceTable.billTax || 0}
                cgstAmount={invoiceTable.billCgst}
                sgstAmount={invoiceTable.billSgst}
                taxPercent={invoiceTable.taxRate || 5}
                taxName={invoiceTable.taxName || "GST"}
                total={invoiceTable.billTotal}
              />

              {/* Action buttons (hidden on print) */}
              <div className="p-4 bg-muted/40 border-t border-border flex gap-3 no-print">
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => printReceipt("printable-invoice", `Tax Invoice - ${invoiceTable?.name ?? "Table"}`)}
                >
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setInvoiceTable(null)}
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
