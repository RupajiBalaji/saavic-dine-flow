import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus } from "lucide-react";
import { inr } from "@/lib/format";
import type { CartModifier } from "@/lib/cart";

export type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  ingredients: string | null;
  price: number;
  status: string;
  image_url: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  allergens: string | null;
  category_id: string | null;
  is_meal_plan: boolean;
};

export type ModifierGroup = {
  id: string;
  name: string;
  selection_type: string;
  options: { id: string; name: string; price_delta: number }[];
};

export function ProductDialog({
  product,
  groups,
  image,
  onClose,
  onAdd,
}: {
  product: MenuProduct | null;
  groups: ModifierGroup[];
  image: string;
  onClose: () => void;
  onAdd: (args: { quantity: number; notes: string; modifiers: CartModifier[] }) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setQuantity(1);
    setNotes("");
    setSelected({});
  }, [product?.id]);

  if (!product) return null;
  const unavailable = product.status !== "AVAILABLE";

  const chosen: CartModifier[] = groups.flatMap((g) =>
    (selected[g.id] ?? [])
      .map((optId) => g.options.find((o) => o.id === optId))
      .filter(Boolean)
      .map((o) => ({ optionId: o!.id, name: o!.name, price_delta: Number(o!.price_delta) })),
  );
  const unitPrice = Number(product.price) + chosen.reduce((s, m) => s + m.price_delta, 0);

  const toggle = (group: ModifierGroup, optionId: string) => {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selection_type === "SINGLE") return { ...prev, [group.id]: current[0] === optionId ? [] : [optionId] };
      return {
        ...prev,
        [group.id]: current.includes(optionId) ? current.filter((x) => x !== optionId) : [...current, optionId],
      };
    });
  };

  return (
    <Dialog open={Boolean(product)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto p-0" aria-describedby={undefined}>
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="h-48 w-full object-cover"
          width={816}
          height={816}
        />
        <div className="space-y-4 p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
            {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
          </DialogHeader>

          <p className="text-2xl font-semibold text-primary">{inr(product.price)}</p>

          {product.ingredients && (
            <div>
              <p className="text-sm font-medium">Ingredients</p>
              <p className="text-sm text-muted-foreground">{product.ingredients}</p>
            </div>
          )}

          {(product.calories || product.protein_g || product.carbs_g || product.fats_g) && (
            <div className="flex flex-wrap gap-2">
              {product.calories ? <Badge variant="secondary">{product.calories} kcal</Badge> : null}
              {product.protein_g ? <Badge variant="secondary">{product.protein_g}g protein</Badge> : null}
              {product.carbs_g ? <Badge variant="secondary">{product.carbs_g}g carbs</Badge> : null}
              {product.fats_g ? <Badge variant="secondary">{product.fats_g}g fats</Badge> : null}
            </div>
          )}
          {product.allergens && <p className="text-xs text-muted-foreground">Allergens: {product.allergens}</p>}

          {groups.map((group) => (
            <fieldset key={group.id} className="space-y-2">
              <legend className="text-sm font-medium">{group.name}</legend>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const active = (selected[group.id] ?? []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(group, opt.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-accent"
                      }`}
                    >
                      {opt.name}
                      {Number(opt.price_delta) > 0 ? ` +${inr(opt.price_delta)}` : ""}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="item-notes">Any special request?</Label>
            <Input
              id="item-notes"
              maxLength={200}
              placeholder="e.g. Don't add onion"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 rounded-full border border-border px-2 py-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center font-medium">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="flex-1"
              disabled={unavailable}
              onClick={() => onAdd({ quantity, notes: notes.trim(), modifiers: chosen })}
            >
              {unavailable ? "Currently unavailable" : `Add · ${inr(unitPrice * quantity)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
