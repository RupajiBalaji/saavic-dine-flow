import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/format";
import { Leaf, Sparkles } from "lucide-react";

type Plan = { id: string; name: string; price: number; protein: string };

export function ComboPopup({
  open,
  onOpenChange,
  onViewPlan,
  plans,
  addonPrice,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onViewPlan: (planId: string) => void;
  plans: Plan[];
  addonPrice: number | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0" aria-describedby={undefined}>
        <div className="hero-gradient px-6 py-7 text-center text-primary-foreground">
          <Leaf className="mx-auto mb-2 h-6 w-6" aria-hidden />
          <h2 className="font-display text-2xl font-semibold">26 DAYS OF CLEAN</h2>
          <p className="mt-1 text-sm opacity-90">High-protein meals. Freshly prepared every day.</p>
        </div>
        <div className="space-y-3 p-5">
          {plans.map((plan) => (
            <div key={plan.id} className="surface-card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-display text-lg font-semibold">{plan.name}</p>
                <p className="text-sm text-muted-foreground">26 days · {plan.protein}</p>
                <p className="mt-1 text-lg font-semibold text-primary">{inr(plan.price)}</p>
              </div>
              <Button size="sm" onClick={() => onViewPlan(plan.id)}>
                View plan
              </Button>
            </div>
          ))}
          {addonPrice !== null && (
            <p className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
              <Sparkles className="h-4 w-4" aria-hidden />
              Add Wellness Shot · +{inr(addonPrice)} / 26 days
            </p>
          )}
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
