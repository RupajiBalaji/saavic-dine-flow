/**
 * Utility for printing receipts and tax invoices cleanly.
 * Uses an isolated invisible iframe so modals, Radix portals, dark mode,
 * and page layout never interfere or generate blank pages.
 */
export function printReceipt(elementId: string = "printable-invoice", title: string = "Tax Invoice - Saavic Healthy Café") {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    window.print();
    return;
  }

  // Remove any previous print frame
  const existingFrame = document.getElementById("saavic-receipt-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "saavic-receipt-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Generate clean thermal / standard printer HTML
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: auto;
            margin: 4mm 6mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000000;
            background: #ffffff;
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
            padding: 8px 4px;
          }
          .no-print, button {
            display: none !important;
          }
          /* Typography & utility mappings */
          h2 {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.5px;
            text-align: center;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-extrabold { font-weight: 800; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .uppercase { text-transform: uppercase; }
          .tracking-widest { letter-spacing: 0.15em; }
          .tracking-tight { letter-spacing: -0.025em; }
          
          /* Colors to high-contrast black/dark grey */
          .text-muted-foreground, .text-muted { color: #555555 !important; }
          .text-foreground { color: #000000 !important; }
          .text-emerald-600, .text-emerald-400 { color: #047857 !important; }
          .text-amber-600, .text-amber-400 { color: #b45309 !important; }
          .text-destructive { color: #b91c1c !important; }

          /* Layout */
          .flex { display: flex; }
          .flex-wrap { flex-wrap: wrap; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-1\\.5 > * + * { margin-top: 6px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-3 > * + * { margin-top: 10px; }
          .space-y-4 > * + * { margin-top: 14px; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gap-2 { gap: 8px; }

          /* Borders & Dividers */
          .border { border: 1px solid #777; }
          .border-b { border-bottom: 1px solid #777; }
          .border-t { border-top: 1px solid #777; }
          .border-t-2 { border-top: 2px solid #000; }
          .border-dashed { border-style: dashed; }
          .border-border { border-color: #999; }
          .border-border\\/60 { border-color: #bbb; }
          .divide-y > * + * { border-top: 1px dotted #ccc; }

          /* Spacing */
          .p-6 { padding: 4px; }
          .pb-4 { padding-bottom: 12px; }
          .pb-3 { padding-bottom: 8px; }
          .pb-2 { padding-bottom: 6px; }
          .pb-1\\.5 { padding-bottom: 5px; }
          .pt-4 { padding-top: 12px; }
          .pt-3 { padding-top: 8px; }
          .pt-2 { padding-top: 6px; }
          .pt-1\\.5 { padding-top: 5px; }
          .pt-1 { padding-top: 4px; }
          .pt-0\\.5 { padding-top: 2px; }
          .py-3 { padding-top: 8px; padding-bottom: 8px; }
          .py-2 { padding-top: 6px; padding-bottom: 6px; }
          .py-1\\.5 { padding-top: 4px; padding-bottom: 4px; }
          .py-1 { padding-top: 3px; padding-bottom: 3px; }
          .px-2\\.5 { padding-left: 8px; padding-right: 8px; }
          .px-2 { padding-left: 6px; padding-right: 6px; }
          .px-1\\.5 { padding-left: 4px; padding-right: 4px; }
          .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
          .ml-1 { margin-left: 4px; }
          .ml-1\\.5 { margin-left: 6px; }
          .rounded { border-radius: 4px; }
          .rounded-lg { border-radius: 6px; }
          .bg-muted { background-color: #f3f4f6; }
          .bg-foreground { background-color: #000000; color: #ffffff !important; }
          .bg-muted\\/40 { background-color: #f9fafb; border: 1px solid #e5e7eb; }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 13px; }
          .text-base { font-size: 15px; }
          .text-xl { font-size: 18px; }
          .text-\\[10px\\] { font-size: 10px; }
          .text-\\[11px\\] { font-size: 11px; }
          .inline-block { display: inline-block; }
          .block { display: block; }
        </style>
      </head>
      <body>
        ${sourceElement.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Give iframe time to layout styles, then invoke print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn("Iframe print failed, falling back to window.print()", err);
      window.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  }, 250);
}
