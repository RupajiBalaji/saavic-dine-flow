import React from "react";
import { inr, istDateTime, istTime } from "@/lib/format";

export interface InvoiceItem {
  id?: string | undefined;
  name: string;
  quantity: number;
  unitPrice?: number | undefined;
  lineTotal: number;
  notes?: string | null | undefined;
}

export interface TaxInvoiceReceiptProps {
  id?: string | undefined;
  cafe?: {
    name?: string | undefined;
    tagline?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    gstin?: string | undefined;
    fssai?: string | undefined;
    sac_code?: string | undefined;
  } | undefined;
  invoiceNumber?: string | undefined;
  tableName: string;
  sessionCode?: string | undefined;
  customerName?: string | null | undefined;
  customerPhone?: string | null | undefined;
  dateTime?: string | undefined;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number | undefined;
  taxPercent?: number | undefined;
  taxName?: string | undefined;
  cgstAmount?: number | undefined;
  sgstAmount?: number | undefined;
  taxAmount?: number | undefined;
  total: number;
  isPaid?: boolean | undefined;
  paymentMode?: string | null | undefined;
  transactionId?: string | null | undefined;
}

export const TaxInvoiceReceipt: React.FC<TaxInvoiceReceiptProps> = ({
  id = "printable-invoice",
  cafe,
  invoiceNumber,
  tableName,
  sessionCode,
  customerName,
  customerPhone,
  dateTime,
  items,
  subtotal,
  discount = 0,
  taxPercent = 5,
  taxName = "GST",
  cgstAmount,
  sgstAmount,
  taxAmount,
  total,
  isPaid = true,
  paymentMode = "CASH",
  transactionId,
}) => {
  const cafeName = cafe?.name || "Saavic Healthy Café";
  const cafeTagline = cafe?.tagline || "EAT CLEAN • FEEL STRONG • LIVE BETTER";
  const cafeAddress = cafe?.address || "Plot 42, Road No. 36, Jubilee Hills, Hyderabad - 500033";
  const cafePhone = cafe?.phone || "+91 98765 43210";
  const gstin = cafe?.gstin || "36AAGCS1234F1Z1";
  const fssai = cafe?.fssai || "13624011000123";
  const sacCode = cafe?.sac_code || "996331";

  // Compute tax split if not explicitly provided
  const effectiveTax = taxAmount !== undefined ? taxAmount : Math.max(0, total - (subtotal - discount));
  const halfTax = Math.round((effectiveTax / 2) * 100) / 100;
  const effectiveCgst = cgstAmount !== undefined ? cgstAmount : halfTax;
  const effectiveSgst = sgstAmount !== undefined ? sgstAmount : Math.round((effectiveTax - halfTax) * 100) / 100;
  const halfRate = (taxPercent / 2).toFixed(1).replace(/\.0$/, "");

  return (
    <div id={id} className="p-6 text-foreground bg-background space-y-3 text-xs">
      {/* Café Header */}
      <div className="text-center pb-3 border-b border-dashed border-border space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">{cafeName}</h2>
        <p className="text-[11px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
          {cafeTagline}
        </p>
        <p className="text-[11px] text-muted-foreground pt-0.5">{cafeAddress}</p>
        {cafePhone && <p className="text-[11px] text-muted-foreground">Ph: {cafePhone}</p>}

        {/* GSTIN & FSSAI Badges */}
        <div className="pt-1.5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-muted font-semibold text-foreground border border-border/60">
            GSTIN: {gstin}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-muted font-semibold text-foreground border border-border/60">
            FSSAI: {fssai}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-muted font-semibold text-foreground border border-border/60">
            SAC: {sacCode}
          </span>
        </div>

        <div className="pt-1">
          <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-foreground text-background rounded">
            TAX INVOICE
          </span>
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="py-2 border-b border-dashed border-border space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Table:</span>
          <span className="font-bold text-foreground">{tableName}</span>
        </div>
        {sessionCode && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Session Code:</span>
            <span className="font-mono font-semibold text-foreground">{sessionCode}</span>
          </div>
        )}
        {customerName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="text-foreground font-medium">
              {customerName} {customerPhone ? `(${customerPhone})` : ""}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date & Time:</span>
          <span className="text-foreground">{dateTime || istTime(new Date().toISOString())}</span>
        </div>
        {(transactionId || invoiceNumber) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice / Txn No:</span>
            <span className="font-mono font-semibold text-foreground">{transactionId || invoiceNumber}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment Status:</span>
          <span
            className={`font-bold uppercase ${
              isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {isPaid ? "PAID" : "DUE"}
          </span>
        </div>
        {paymentMode && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Mode:</span>
            <span className="capitalize text-foreground font-semibold">
              {paymentMode.toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {/* Itemized Table */}
      <div className="py-2 border-b border-dashed border-border">
        <div className="flex justify-between font-bold text-muted-foreground pb-1.5 border-b border-border/60 text-[11px] uppercase tracking-wider">
          <span>Item</span>
          <span className="text-right">Amount</span>
        </div>
        <div className="divide-y divide-border/40 py-1">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="py-1.5 flex justify-between items-start text-xs">
              <div className="flex-1 pr-2">
                <span className="font-semibold text-foreground">{item.name}</span>
                <span className="text-muted-foreground ml-1 font-normal">
                  × {item.quantity}
                  {item.unitPrice ? ` @ ${inr(item.unitPrice)}` : ""}
                </span>
                {item.notes && (
                  <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                    Note: {item.notes}
                  </span>
                )}
              </div>
              <span className="font-mono font-medium text-foreground text-right">
                {inr(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GST & Financial Calculation Breakdown */}
      <div className="py-2 border-b border-dashed border-border space-y-1.5 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Taxable Subtotal:</span>
          <span className="font-mono font-medium text-foreground">{inr(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Discount:</span>
            <span className="font-mono">- {inr(discount)}</span>
          </div>
        )}

        {/* Explicit CGST + SGST Breakdown */}
        <div className="flex justify-between text-muted-foreground">
          <span>CGST ({halfRate}%):</span>
          <span className="font-mono text-foreground">{inr(effectiveCgst)}</span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>SGST ({halfRate}%):</span>
          <span className="font-mono text-foreground">{inr(effectiveSgst)}</span>
        </div>

        <div className="flex justify-between text-muted-foreground text-[11px]">
          <span>Total {taxName} ({taxPercent}%):</span>
          <span className="font-mono font-medium text-foreground">{inr(effectiveTax)}</span>
        </div>

        {/* Grand Total */}
        <div className="flex justify-between font-extrabold text-sm text-foreground pt-1.5 border-t-2 border-foreground">
          <span>Total Amount</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
            {inr(total)}
          </span>
        </div>
      </div>

      {/* Statutory Footer */}
      <div className="pt-2 text-center space-y-1 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Thank you for dining with Saavic Healthy Café!</p>
        <p className="text-[10px] text-muted-foreground">Prices are inclusive of applicable taxes.</p>
        <p className="text-[10px] text-muted-foreground">
          This is a computer-generated tax invoice. No signature required.
        </p>
      </div>
    </div>
  );
};
