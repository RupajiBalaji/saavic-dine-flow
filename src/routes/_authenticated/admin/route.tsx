import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ReceiptText,
  Grid3x3,
  ChefHat,
  UtensilsCrossed,
  QrCode,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Leaf,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaffProfile } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { istDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
  { to: "/admin/tables", label: "Tables", icon: Grid3x3 },
  { to: "/admin/kitchen", label: "Kitchen", icon: ChefHat },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/admin/qr", label: "Table QR", icon: QrCode },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const me = useQuery({ queryKey: ["staff-me"], queryFn: () => getMyStaffProfile(), retry: false });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/auth", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (me.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="surface-card max-w-sm p-8 text-center">
          <h1 className="font-display text-xl">No staff access yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">{(me.error as Error).message}</p>
          <Button className="mt-4" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
        <div className="px-2 pb-5">
          <p className="brand-wordmark text-xl font-semibold">Saavic</p>
          <p className="text-[10px] tracking-[0.25em] opacity-70">HEALTHY CAFÉ</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
                }`}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" className="justify-start text-sidebar-foreground" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden /> Logout
        </Button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary md:hidden" aria-hidden />
            <div>
              <p className="font-display text-lg leading-tight">Saavic Healthy Café</p>
              <p className="text-xs text-muted-foreground">{istDate()} · IST</p>
            </div>
          </div>
          <div className="text-right text-xs">
            {me.isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <>
                <p className="font-medium">{me.data?.email}</p>
                <p className="text-muted-foreground">{me.data?.roles.join(" · ")}</p>
              </>
            )}
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
