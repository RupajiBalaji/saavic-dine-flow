import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Settings as SettingsIcon, Save, Store, Receipt, Clock, Phone, MapPin, Lock } from "lucide-react";
import { toast } from "sonner";

import { getAdminSettings, saveSettings, getMyStaffProfile } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const getSettingsFn = useServerFn(getAdminSettings);
  const saveSettingsFn = useServerFn(saveSettings);

  const meQuery = useQuery({
    queryKey: ["staff-me"],
    queryFn: () => getMyStaffProfile(),
  });

  const isSuperAdmin = Boolean(meQuery.data?.roles.includes("SUPER_ADMIN"));

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getSettingsFn(),
    enabled: isSuperAdmin,
  });

  const [form, setForm] = useState<any | null>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await saveSettingsFn({ data: payload });
    },
    onSuccess: () => {
      toast.success("Café settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save settings"),
  });

  if (meQuery.isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="surface-card p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="font-display text-xl font-semibold">Super Admin Access Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Store configuration, GST tax rates, and core business settings are restricted to the Super Admin.
          </p>
        </div>
      </div>
    );
  }

  if (settingsQuery.isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-7 w-7 text-emerald-600" />
            Café Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure store branding, operational hours, tax rates, and digital ordering rules.
          </p>
        </div>

        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate(form)}
        >
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Café Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              Store Information & Branding
            </CardTitle>
            <CardDescription>
              Details displayed to customers on table menus and printed digital tax invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Café Name</label>
                <Input
                  value={form.cafe.name}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, name: e.target.value } })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tagline</label>
                <Input
                  value={form.cafe.tagline}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, tagline: e.target.value } })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone Number</label>
                <Input
                  value={form.cafe.phone}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, phone: e.target.value } })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">WhatsApp Number</label>
                <Input
                  value={form.cafe.whatsapp}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, whatsapp: e.target.value } })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Address</label>
              <Input
                value={form.cafe.address}
                onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, address: e.target.value } })}
                placeholder="Shop 4, Road No. 1, Hyderabad, Telangana"
              />
            </div>
          </CardContent>
        </Card>

        {/* GST & Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Taxes & GST Engine
            </CardTitle>
            <CardDescription>
              Configure restaurant GST applied across food orders and tax invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tax Name</label>
                <Input
                  value={form.tax.name}
                  onChange={(e) => setForm({ ...form, tax: { ...form.tax, name: e.target.value } })}
                  placeholder="GST"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tax Rate (%)</label>
                <Input
                  type="number"
                  value={form.tax.percent}
                  onChange={(e) => setForm({ ...form, tax: { ...form.tax, percent: Number(e.target.value) } })}
                  placeholder="5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  GSTIN (GST Identification Number)
                </label>
                <Input
                  value={form.cafe.gstin || ""}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, gstin: e.target.value } })}
                  placeholder="36AAGCS1234F1Z1"
                  className="font-mono uppercase"
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  15-character state GSTIN printed on tax invoices.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  FSSAI License No.
                </label>
                <Input
                  value={form.cafe.fssai || ""}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, fssai: e.target.value } })}
                  placeholder="13624011000123"
                  className="font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  14-digit Food Safety and Standards Authority license number.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Restaurant SAC Code
                </label>
                <Input
                  value={form.cafe.sac_code || "996331"}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, sac_code: e.target.value } })}
                  placeholder="996331"
                  className="font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Service Accounting Code (Default 996331 for restaurant & café services).
                </p>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-xs font-semibold text-muted-foreground mb-1">Tax Split Preview</span>
                <div className="rounded-lg bg-muted/50 p-2 text-xs border border-border/60">
                  <span className="font-semibold text-foreground">
                    CGST {((form.tax.percent || 5) / 2).toFixed(1)}% + SGST {((form.tax.percent || 5) / 2).toFixed(1)}%
                  </span>
                  <p className="text-[11px] text-muted-foreground">Automatically calculated and printed on invoices.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">Inclusive Tax</span>
                <p className="text-xs text-muted-foreground">
                  If enabled, menu prices already include tax. Default for cafés is Exclusive (tax added at checkout).
                </p>
              </div>
              <Switch
                checked={form.tax.inclusive}
                onCheckedChange={(checked) => setForm({ ...form, tax: { ...form.tax, inclusive: checked } })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ordering Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Digital Ordering & Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">Digital QR Ordering Enabled</span>
                <p className="text-xs text-muted-foreground">
                  Master switch. When turned off, customers can only browse the menu, not submit orders.
                </p>
              </div>
              <Switch
                checked={form.cafe.ordering_enabled}
                onCheckedChange={(checked) =>
                  setForm({ ...form, cafe: { ...form.cafe, ordering_enabled: checked } })
                }
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Opening Time</label>
                <Input
                  type="time"
                  value={form.cafe.opening_time}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, opening_time: e.target.value } })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Closing Time</label>
                <Input
                  type="time"
                  value={form.cafe.closing_time}
                  onChange={(e) => setForm({ ...form, cafe: { ...form.cafe, closing_time: e.target.value } })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
