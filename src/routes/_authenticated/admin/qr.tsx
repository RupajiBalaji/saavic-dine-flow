import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Printer,
  Download,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/qr")({
  component: TableQrPage,
});

type TableQrItem = {
  id: number;
  name: string;
  slug: string;
  qrDataUrl: string;
};

function TableQrPage() {
  const [domain, setDomain] = useState("");
  const [tables, setTables] = useState<TableQrItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Initialize domain from browser origin or fallback
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomain(window.location.origin);
    }
  }, []);

  // Generate QR codes for all 20 tables whenever domain changes
  useEffect(() => {
    if (!domain) return;
    const base = domain.replace(/\/$/, "");

    let active = true;
    async function buildQrs() {
      const items: TableQrItem[] = [];
      for (let i = 1; i <= 20; i++) {
        const num = String(i).padStart(2, "0");
        const slug = `table-${num}`;
        const url = `${base}/menu?table=${slug}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(url, {
            width: 800,
            margin: 2,
            color: {
              dark: "#1e3a2b",
              light: "#ffffff",
            },
            errorCorrectionLevel: "H",
          });
          items.push({
            id: i,
            name: `Table ${num}`,
            slug,
            qrDataUrl,
          });
        } catch {
          // fallback to pre-rendered static asset
          items.push({
            id: i,
            name: `Table ${num}`,
            slug,
            qrDataUrl: `/qr-codes/${slug}.png`,
          });
        }
      }
      if (active) setTables(items);
    }

    buildQrs();
    return () => {
      active = false;
    };
  }, [domain]);

  const copyUrl = (slug: string) => {
    const base = domain.replace(/\/$/, "");
    const url = `${base}/menu?table=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    toast.success(`Copied ${url}`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const downloadQr = (table: TableQrItem) => {
    const a = document.createElement("a");
    a.href = table.qrDataUrl;
    a.download = `saavic-${table.slug}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded QR for ${table.name}`);
  };

  const filteredTables = tables.filter((t) => {
    if (filter === "1-10") return t.id <= 10;
    if (filter === "11-20") return t.id > 10;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header controls (hidden on print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <QrCode className="h-6 w-6 text-emerald-600" />
              Table QR Codes & Stand Cards
            </h1>
            <p className="text-sm text-muted-foreground">
              Instant digital ordering QR codes for Tables 01 to 20. Ready to print for acrylic stands.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open public QR directory
                window.open("/qr-codes/table-01.png", "_blank");
              }}
            >
              <Download className="mr-1.5 h-4 w-4" /> Static PNGs
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="mr-1.5 h-4 w-4" /> Print All Stand Cards
            </Button>
          </div>
        </div>

        {/* Configuration Bar */}
        <Card className="border-border/80 bg-muted/30">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex-1 max-w-md space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ordering Domain URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="https://saavic.com"
                  className="font-mono text-xs bg-background"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Set to your live café domain when deployed, or localhost while testing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Filter:</span>
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                className="h-8 text-xs"
              >
                All (1–20)
              </Button>
              <Button
                size="sm"
                variant={filter === "1-10" ? "default" : "outline"}
                onClick={() => setFilter("1-10")}
                className="h-8 text-xs"
              >
                Tables 01–10
              </Button>
              <Button
                size="sm"
                variant={filter === "11-20" ? "default" : "outline"}
                onClick={() => setFilter("11-20")}
                className="h-8 text-xs"
              >
                Tables 11–20
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Instructions & Ideas Alert */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-2 text-foreground">
          <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span>How to use these in your Café:</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 pt-1 text-muted-foreground">
            <div className="rounded-lg bg-background/80 p-2.5 border border-border/50">
              <strong className="text-foreground block mb-0.5">1. Acrylic Table Stands (A6/4×6")</strong>
              Print the cards below, trim them, and slide into clear acrylic stands on each table.
            </div>
            <div className="rounded-lg bg-background/80 p-2.5 border border-border/50">
              <strong className="text-foreground block mb-0.5">2. Table Top Stickers</strong>
              Use the downloadable PNGs to print waterproof matte vinyl decals for table corners.
            </div>
            <div className="rounded-lg bg-background/80 p-2.5 border border-border/50">
              <strong className="text-foreground block mb-0.5">3. Wooden Blocks / Cubes</strong>
              Print on engraved or laser-printed wooden cubes for an organic, healthy café look.
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Printable Table Stand Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
        {filteredTables.map((table) => {
          const targetUrl = `${domain.replace(/\/$/, "")}/menu?table=${table.slug}`;

          return (
            <div
              key={table.id}
              className="table-stand-card relative flex flex-col justify-between rounded-2xl border-2 border-border/80 bg-background p-6 shadow-sm print:border-black print:shadow-none print:break-inside-avoid"
            >
              {/* Card Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider text-xs uppercase">
                  <span>Saavic Healthy Café</span>
                </div>
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                  {table.name}
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  EAT CLEAN • FEEL STRONG • LIVE BETTER
                </p>
              </div>

              {/* QR Code Container */}
              <div className="my-4 flex flex-col items-center justify-center">
                <div className="relative rounded-xl border border-border/60 bg-white p-3 shadow-inner">
                  {table.qrDataUrl ? (
                    <img
                      src={table.qrDataUrl}
                      alt={`QR code for ${table.name}`}
                      className="h-44 w-44 object-contain"
                    />
                  ) : (
                    <div className="h-44 w-44 animate-pulse bg-muted rounded" />
                  )}
                </div>
                <span className="mt-2 font-mono text-[11px] text-muted-foreground">
                  /menu?table={table.slug}
                </span>
              </div>

              {/* Customer 3-Step Instructions */}
              <div className="rounded-xl bg-muted/40 p-3 text-center text-xs space-y-1 border border-border/40">
                <p className="font-semibold text-foreground text-[11px]">Contactless Table Ordering</p>
                <ol className="text-[10px] text-muted-foreground space-y-0.5 leading-tight text-left list-decimal list-inside pl-1">
                  <li>Scan QR with your phone camera</li>
                  <li>Browse dishes & customize your meal</li>
                  <li>Order & pay directly from your seat!</li>
                </ol>
              </div>

              {/* Action Toolbar (hidden on print) */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2 no-print">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs flex-1 gap-1"
                  onClick={() => downloadQr(table)}
                >
                  <Download className="h-3.5 w-3.5" /> PNG
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs flex-1 gap-1"
                  onClick={() => copyUrl(table.slug)}
                >
                  {copiedSlug === table.slug ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Link
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  asChild
                >
                  <a href={targetUrl} target="_blank" rel="noreferrer" title="Open customer view">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
