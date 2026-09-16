import { useCallback, useEffect, useState } from "react";

export type CartModifier = { optionId: string; name: string; price_delta: number };
export type CartItem = {
  key: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  modifiers: CartModifier[];
};

const keyFor = (slug: string) => `saavic:cart:${slug}`;

/** Cart persisted per table in localStorage so a refresh never loses the order. */
export function useCart(tableSlug: string) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(tableSlug));
      setItems(raw ? (JSON.parse(raw) as CartItem[]) : []);
    } catch {
      setItems([]);
    }
    setHydrated(true);
  }, [tableSlug]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(keyFor(tableSlug), JSON.stringify(items));
  }, [items, tableSlug, hydrated]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.productId}:${item.modifiers.map((m) => m.optionId).sort().join(",")}:${item.notes ?? ""}`;
    setItems((prev) => {
      const found = prev.find((p) => p.key === key);
      if (found)
        return prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(20, p.quantity + item.quantity) } : p));
      return [...prev, { ...item, key }];
    });
  }, []);

  const setQty = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((p) => p.key !== key) : prev.map((p) => (p.key === key ? { ...p, quantity } : p)),
    );
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, add, setQty, remove, clear, subtotal, count, hydrated };
}

/** Stores the customer's session credentials for this table (survives refresh / browser close). */
export type StoredSession = { sessionId: string; sessionToken: string };

export function readStoredSession(slug: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(`saavic:session:${slug}`);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(slug: string, value: StoredSession | null) {
  if (value) localStorage.setItem(`saavic:session:${slug}`, JSON.stringify(value));
  else localStorage.removeItem(`saavic:session:${slug}`);
}
