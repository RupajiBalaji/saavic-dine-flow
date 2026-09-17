import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, IndianRupee, ReceiptText, Timer, Grid3x3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDashboard } from "@/lib/admin.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(),
    refetchInterval: 20000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading || !data) return <Skeleton className="h-64 w-full rounded-xl" />;

  const cards = [
    { label: "Today's sales", value: inr(data.sales), icon: IndianRupee },
    { label: "Orders", value: String(data.orderCount), icon: ReceiptText },
    { label: "Active tables", value: `${data.activeTables} / ${data.totalTables}`, icon: Grid3x3 },
    { label: "Pending orders", value: String(data.pendingOrders), icon: Timer },
    { label: "Pending payments", value: String(data.pendingPayments), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="surface-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <c.icon className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <p className="mt-2 font-display text-2xl">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="surface-card p-4 lg:col-span-2">
          <h2 className="font-display text-lg">Orders value by hour (IST)</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-4">
          <h2 className="font-display text-lg">Stock alerts</h2>
          {data.lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">All ingredients are above minimum stock.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between text-sm">
                  <span>
                    {i.name} · {i.stock} {i.unit}
                  </span>
                  <Badge variant={i.critical ? "destructive" : "secondary"}>
                    {i.critical ? "CRITICAL" : "LOW"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/tables" className="mt-4 inline-block text-sm text-primary underline">
            Open live table map
          </Link>
        </section>
      </div>
    </div>
  );
}
