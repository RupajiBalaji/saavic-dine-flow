import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaffProfile } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { istDate, inr } from "@/lib/format";
import { playNewOrderTing, playOrderReadyChime, isSoundEnabled, setSoundEnabled } from "@/lib/sounds";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

type NavRole = "SUPER_ADMIN" | "MANAGER" | "KITCHEN_STAFF";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  exact?: boolean;
  roles?: NavRole[];
};

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["SUPER_ADMIN", "MANAGER"] },
  { to: "/admin/tables", label: "Tables & Bills", icon: Grid3x3, roles: ["SUPER_ADMIN", "MANAGER"] },
  { to: "/admin/reports", label: "Reports & Excel", icon: BarChart3, roles: ["SUPER_ADMIN"] },
  { to: "/admin/kitchen", label: "Kitchen", icon: ChefHat, roles: ["SUPER_ADMIN", "MANAGER", "KITCHEN_STAFF"] },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText, roles: ["SUPER_ADMIN", "MANAGER", "KITCHEN_STAFF"] },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed, roles: ["SUPER_ADMIN", "MANAGER"] },
  { to: "/admin/qr", label: "Table QR", icon: QrCode, roles: ["SUPER_ADMIN", "MANAGER"] },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon, roles: ["SUPER_ADMIN", "MANAGER"] },
];

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

  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playNewOrderTing();
      toast.success("Alert sounds enabled (Test Ting)");
    } else {
      toast.info("Alert sounds muted");
    }
  };

  // Realtime order sound alerts for Kitchen & Managers
  useEffect(() => {
    if (!me.data) return;

    const channel = supabase
      .channel("admin-orders-audio-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
          queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["admin-tables"] });

          // 1. New Order Received (Counter Bell "Ting") -> For Kitchen & Manager
          if (payload.eventType === "INSERT") {
            const order = payload.new as any;
            playNewOrderTing();
            toast.info(`🔔 New Order #${order.order_number || "SV"} received!`, {
              description: `Amount: ${inr(order.total || order.subtotal || 0)}`,
              duration: 6000,
            });
          }

          // 2. Order Ready to Serve (Dining Bell Chime) -> For Manager / Staff
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as any;
            const old = payload.old as any;
            if (updated.status === "READY" && old?.status !== "READY") {
              playOrderReadyChime();
              toast.success(`🍽️ Order #${updated.order_number || "SV"} is READY to serve!`, {
                description: "Kitchen has prepared the order. Ready for pickup and serving to table.",
                duration: 8000,
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me.data, queryClient]);

  // Enforce strict role-based route access
  useEffect(() => {
    if (!me.data) return;
    const userRoles = (me.data.roles ?? []) as NavRole[];
    const isSuperAdmin = userRoles.includes("SUPER_ADMIN");
    if (isSuperAdmin) return; // Super admin can access every page

    // If kitchen staff lands on root /admin, redirect to /admin/kitchen
    if (pathname === "/admin" && userRoles.includes("KITCHEN_STAFF") && !userRoles.includes("MANAGER")) {
      navigate({ to: "/admin/kitchen", replace: true });
      return;
    }

    // Check if the current route is allowed for user's assigned roles
    const currentNavItem = NAV.find((item) =>
      item.exact ? pathname === item.to : pathname.startsWith(item.to),
    );

    if (currentNavItem && currentNavItem.roles) {
      const hasAccess = currentNavItem.roles.some((r) => userRoles.includes(r));
      if (!hasAccess) {
        if (userRoles.includes("KITCHEN_STAFF") && !userRoles.includes("MANAGER")) {
          navigate({ to: "/admin/kitchen", replace: true });
        } else if (userRoles.includes("MANAGER")) {
          navigate({ to: "/admin", replace: true });
        }
      }
    }
  }, [pathname, me.data, navigate]);

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

  const userRoles = (me.data?.roles ?? []) as NavRole[];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");
  const visibleNav = NAV.filter((item) => {
    if (!item.roles || isSuperAdmin) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
        <div className="px-2 pb-5">
          <p className="brand-wordmark text-xl font-semibold">Saavic</p>
          <p className="text-[10px] tracking-[0.25em] opacity-70">HEALTHY CAFÉ</p>
        </div>
        <nav className="flex-1 space-y-1">
          {visibleNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as any}
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleSound}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 border-border/80"
              title={soundOn ? "Mute audio alerts" : "Unmute audio alerts"}
            >
              {soundOn ? (
                <Volume2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="hidden sm:inline">{soundOn ? "Alerts On" : "Muted"}</span>
            </Button>

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
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {visibleNav.map((item) => (
            <Link
              key={item.to}
              to={item.to as any}
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
