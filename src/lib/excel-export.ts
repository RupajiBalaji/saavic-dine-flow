import * as XLSX from "xlsx";

export type BillExportRow = {
  "Bill / Order No.": string;
  "Session Code": string;
  "Table": string;
  "Bill Date (IST)": string;
  "Bill Time (IST)": string;
  "Order Status": string;
  "Payment Status": string;
  "Transaction ID": string;
  "Payment Time (IST)": string;
  "Payment Provider": string;
  "Payment Method": string;
  "Customer Name": string;
  "Phone": string;
  "Subtotal (INR)": number;
  "Discount (INR)": number;
  "Taxable Value (INR)": number;
  "GST (5%) (INR)": number;
  "Total Amount (INR)": number;
  "Items Summary": string;
};

export type TransactionLedgerRow = {
  "Transaction ID": string;
  "Payment Date (IST)": string;
  "Payment Time (IST)": string;
  "Table": string;
  "Session Code": string;
  "Payment Method": string;
  "Payment Provider": string;
  "Amount Paid (INR)": number;
  "Status": string;
  "Reference / Gateway ID": string;
  "Notes": string;
};

export type ItemSalesRow = {
  "Item Name": string;
  "Category": string;
  "Quantity Sold": number;
  "Total Sales (INR)": number;
};

export type PaymentSummaryRow = {
  "Payment Provider": string;
  "Transactions Count": number;
  "Total Collected (INR)": number;
};

export type TaxSummaryRow = {
  "Tax Name": string;
  "Tax Rate": string;
  "Taxable Amount (INR)": number;
  "Tax Collected (INR)": number;
  "Gross Sales (INR)": number;
};

export function exportBillsWorkbook({
  periodLabel,
  bills,
  transactionsLedger,
  itemSales,
  paymentSummary,
  taxSummary,
  filename,
}: {
  periodLabel: string;
  bills: BillExportRow[];
  transactionsLedger?: TransactionLedgerRow[];
  itemSales: ItemSalesRow[];
  paymentSummary: PaymentSummaryRow[];
  taxSummary: TaxSummaryRow[];
  filename?: string;
}) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Detailed Bills
  const wsBills = XLSX.utils.json_to_sheet(
    bills.length > 0 ? bills : [{ "No Records": "No bills for this period" }],
  );
  XLSX.utils.book_append_sheet(wb, wsBills, "Bills & Invoices");

  // Sheet 2: Itemized Transactions Ledger
  if (transactionsLedger && transactionsLedger.length > 0) {
    const wsLedger = XLSX.utils.json_to_sheet(transactionsLedger);
    XLSX.utils.book_append_sheet(wb, wsLedger, "Transactions Ledger");
  } else {
    const wsLedger = XLSX.utils.json_to_sheet([{ "No Records": "No completed transactions for this period" }]);
    XLSX.utils.book_append_sheet(wb, wsLedger, "Transactions Ledger");
  }

  // Sheet 3: Item-wise Sales
  const wsItems = XLSX.utils.json_to_sheet(
    itemSales.length > 0 ? itemSales : [{ "No Records": "No item sales" }],
  );
  XLSX.utils.book_append_sheet(wb, wsItems, "Item Sales Breakdown");

  // Sheet 4: Payment & Tax Reconciliation
  const wsSummary = XLSX.utils.json_to_sheet([
    ...paymentSummary,
    {} as any,
    { "Payment Provider": "--- GST TAX REPORT ---" } as any,
    ...taxSummary.map((t) => ({
      "Payment Provider": `${t["Tax Name"]} (${t["Tax Rate"]})`,
      "Transactions Count": t["Taxable Amount (INR)"] as any,
      "Total Collected (INR)": t["Tax Collected (INR)"],
    })),
  ]);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Payment & Tax Summary");

  const safeFilename = filename || `Saavic_Bills_${periodLabel.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

export function exportBillsCSV(bills: BillExportRow[], filename = "Saavic_Bills.csv") {
  const ws = XLSX.utils.json_to_sheet(bills);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
