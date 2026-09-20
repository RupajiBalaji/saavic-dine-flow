import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileSpreadsheet,
  Download,
  IndianRupee,
  ReceiptText,
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

import { getMyStaffProfile, exportFinancialReports } from "@/lib/admin.functions";
import { exportBillsWorkbook, exportBillsCSV } from "@/lib/excel-export";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: ReportsPage,
});

type Period = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

function ReportsPage() {
  const [period, setPeriod] = useState<Period>("MONTHLY");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const meQuery = useQuery({
    queryKey: ["staff-me"],
    queryFn: () => getMyStaffProfile(),
  });

  const exportFn = useServerFn(exportFinancialReports);

  const reportQuery = useQuery({
    queryKey: ["admin-reports", period, customFrom, customTo],
    queryFn: () =>
      exportFn({
        data: {
          period,
          from: period === "CUSTOM" && customFrom ? new Date(customFrom).toISOString() : undefined,
          to: period === "CUSTOM" && customTo ? new Date(customTo).toISOString() : undefined,
        },
      }),
    enabled: Boolean(meQuery.data?.roles.includes("SUPER_ADMIN")),
  });

  const downloadMutation = useMutation({
    mutationFn: async (format: "EXCEL" | "CSV") => {
      const data = await exportFn({
        data: {
          period,
          from: period === "CUSTOM" && customFrom ? new Date(customFrom).toISOString() : undefined,
          to: period === "CUSTOM" && customTo ? new Date(customTo).toISOString() : undefined,
        },
      });

      if (format === "EXCEL") {
        exportBillsWorkbook({
          periodLabel: data.periodLabel,
          bills: data.bills as any,
          transactionsLedger: (data as any).transactionsLedger,
          itemSales: data.itemSales as any,
          paymentSummary: data.paymentSummary as any,
          taxSummary: data.taxSummary as any,
        });
        toast.success(`Excel workbook downloaded: Saavic_Bills_${data.periodLabel}.xlsx`);
      } else {
        exportBillsCSV(data.bills as any, `Saavic_Bills_${data.periodLabel}.csv`);
        toast.success(`CSV file downloaded: Saavic_Bills_${data.periodLabel}.csv`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not generate download file.");
    },
  });

  const isSuperAdmin = meQuery.data?.roles.includes("SUPER_ADMIN");

  if (meQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  // If user is a MANAGER without SUPER_ADMIN access
  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="surface-card p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="font-display text-xl font-semibold">Super Admin Access Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Full historical financial reports, monthly summaries, and Excel downloads are restricted to the business owner
            (Super Admin).
          </p>
          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-left text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">As a Manager, you have access to:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Live table billing and real-time payment status</li>
              <li>Recent payments feed from the last 2 hours</li>
              <li>Counter cash settlements and table closures</li>
            </ul>
          </div>
          <Button asChild className="mt-6">
            <Link to="/admin/tables">
              Go to Live Tables <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const reportData = reportQuery.data;
  const summary = reportData?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl">Financial Reports & Excel Export</h1>
          <p className="text-sm text-muted-foreground">
            Official billing ledger, GST tax summary, and downloadable workbooks for accounting.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadMutation.mutate("CSV")}
            disabled={downloadMutation.isPending || reportQuery.isLoading}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => downloadMutation.mutate("EXCEL")}
            disabled={downloadMutation.isPending || reportQuery.isLoading}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="surface-card flex flex-wrap items-center gap-2 p-3">
        <span className="mr-2 text-xs font-medium text-muted-foreground">Report Period:</span>
        {(
          [
            { id: "DAILY", label: "Today (Daily)" },
            { id: "WEEKLY", label: "This Week" },
            { id: "MONTHLY", label: "This Month" },
            { id: "YEARLY", label: "This Year" },
            { id: "CUSTOM", label: "Custom Range" },
          ] as const
        ).map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={period === p.id ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}

        {period === "CUSTOM" && (
          <div className="ml-auto flex items-center gap-2 pt-2 sm:pt-0">
            <input
              type="date"
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Gross Revenue</span>
            <IndianRupee className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold">
            {reportQuery.isLoading ? <Skeleton className="h-7 w-24" /> : inr(summary?.totalSales ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">All completed orders</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">GST Collected (5%)</span>
            <Percent className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold">
            {reportQuery.isLoading ? <Skeleton className="h-7 w-24" /> : inr(summary?.totalTax ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Tax component</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Total Orders / Bills</span>
            <ReceiptText className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold">
            {reportQuery.isLoading ? <Skeleton className="h-7 w-16" /> : String(summary?.totalOrders ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Valid customer bills</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Average Bill Value</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold">
            {reportQuery.isLoading ? <Skeleton className="h-7 w-24" /> : inr(summary?.avgOrderValue ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Per completed session</p>
        </div>
      </div>

      {/* Payment Split & Item Breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Payment Summary */}
        <div className="surface-card p-4">
          <h2 className="font-display text-base font-semibold">Payment Reconciliation</h2>
          <p className="text-xs text-muted-foreground">Cash vs Online split for this period</p>
          <div className="mt-4 space-y-3">
            {reportQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              (reportData?.paymentSummary ?? []).map((p) => (
                <div key={p["Payment Provider"]} className="flex items-center justify-between border-b border-border/50 pb-2 text-sm">
                  <div>
                    <p className="font-medium">{p["Payment Provider"]}</p>
                    <p className="text-xs text-muted-foreground">{p["Transactions Count"]} transactions</p>
                  </div>
                  <p className="font-semibold text-primary">{inr(p["Total Collected (INR)"])}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Items Breakdown */}
        <div className="surface-card p-4 lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Top Selling Items</h2>
          <p className="text-xs text-muted-foreground">Volume and revenue by menu product</p>
          <div className="mt-4 max-h-64 overflow-y-auto">
            {reportQuery.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : (reportData?.itemSales ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No item sales recorded in this period.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 font-medium">Item Name</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium text-right">Quantity</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(reportData?.itemSales ?? []).slice(0, 8).map((item) => (
                    <tr key={item["Item Name"]} className="hover:bg-muted/30">
                      <td className="py-2 font-medium">{item["Item Name"]}</td>
                      <td className="py-2 text-muted-foreground">{item["Category"]}</td>
                      <td className="py-2 text-right">{item["Quantity Sold"]}</td>
                      <td className="py-2 text-right font-semibold">{inr(item["Total Sales (INR)"])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Bills Table */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold">Itemized Bills Ledger</h2>
            <p className="text-xs text-muted-foreground">
              Showing {reportData?.bills.length ?? 0} bills included in this report
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {reportData?.periodLabel}
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          {reportQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (reportData?.bills ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No bills found for the selected time range.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2.5 font-medium">Bill No.</th>
                  <th className="pb-2.5 font-medium">Txn ID</th>
                  <th className="pb-2.5 font-medium">Date & Time</th>
                  <th className="pb-2.5 font-medium">Table</th>
                  <th className="pb-2.5 font-medium">Customer</th>
                  <th className="pb-2.5 font-medium">Method</th>
                  <th className="pb-2.5 font-medium text-right">Subtotal</th>
                  <th className="pb-2.5 font-medium text-right">GST (5%)</th>
                  <th className="pb-2.5 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(reportData?.bills ?? []).slice(0, 15).map((b) => (
                  <tr key={b["Bill / Order No."]} className="hover:bg-muted/30">
                    <td className="py-2 font-semibold text-primary">{b["Bill / Order No."]}</td>
                    <td className="py-2 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {b["Transaction ID"] || "-"}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {b["Bill Date (IST)"] || (b as any)["Date (IST)"]} {b["Bill Time (IST)"] || (b as any)["Time (IST)"]}
                    </td>
                    <td className="py-2">{b["Table"]}</td>
                    <td className="py-2 text-muted-foreground">{b["Customer Name"]}</td>
                    <td className="py-2">
                      <Badge variant={b["Payment Method"] === "CASH" || b["Payment Method"] === "Cash" ? "outline" : "secondary"} className="text-[10px]">
                        {b["Payment Method"]}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">{inr(b["Subtotal (INR)"])}</td>
                    <td className="py-2 text-right text-muted-foreground">{inr(b["GST (5%) (INR)"])}</td>
                    <td className="py-2 text-right font-semibold">{inr(b["Total Amount (INR)"])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
