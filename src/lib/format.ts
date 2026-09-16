export const inr = (value: number | string | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const istTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));

export const istDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));

export const istDate = (iso: string | Date = new Date()) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(typeof iso === "string" ? new Date(iso) : iso);

export const ORDER_FLOW = ["PLACED", "ACCEPTED", "PREPARING", "READY", "SERVED", "COMPLETED"] as const;

export const statusLabel: Record<string, string> = {
  PLACED: "Order placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function newIdempotencyKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
