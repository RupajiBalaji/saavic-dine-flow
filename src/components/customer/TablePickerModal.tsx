import { useQuery } from "@tanstack/react-query";
import { X, QrCode, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPublicTables } from "@/lib/customer.functions";

interface TablePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (slug: string) => void;
  currentSlug?: string | null;
}

export function TablePickerModal({
  open,
  onOpenChange,
  onSelect,
  currentSlug,
}: TablePickerModalProps) {
  const { data: tables = [], isLoading, refetch } = useQuery({
    queryKey: ["public-tables"],
    queryFn: () => getPublicTables(),
    refetchInterval: open ? 6000 : false,
  });

  const handleTableClick = (t: { name: string; slug: string; isOccupied: boolean }) => {
    if (t.isOccupied) {
      toast.error(`${t.name} is currently occupied by other guests. Please choose an available table.`, {
        description: "If you are already seated here, check with our staff to unlock the table.",
        duration: 4000,
      });
      return;
    }
    onSelect(t.slug);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#FAF8F5] border-[#E8E2D5] rounded-3xl p-6 sm:p-7 max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF2EC] border border-[#CDE1D2] text-[10px] font-bold uppercase tracking-wider text-[#1B4D2E] mb-1.5">
                <QrCode className="w-3 h-3" />
                <span>Dine-In Table Selection</span>
              </div>
              <DialogTitle className="font-serif text-2xl font-bold text-[#163E24]">
                Select Your Table
              </DialogTitle>
            </div>
          </div>
          <p className="text-xs text-[#5D665A] mt-1">
            Seated at Saavic Healthy Café? Please tap your table number below to access our menu and order.
          </p>

          {/* Status Legend */}
          <div className="flex items-center gap-4 pt-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Not Available (Filled)</span>
            </div>
          </div>
        </DialogHeader>

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto pr-1 pt-2">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-[#EDE9E1] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
              {tables.map((t) => {
                const isCurrent = t.slug === currentSlug;
                const isOccupied = t.isOccupied;

                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => handleTableClick(t)}
                    className={`relative p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between active:scale-95 ${
                      isOccupied
                        ? "bg-stone-100/90 border-stone-200 opacity-70 cursor-not-allowed hover:border-rose-300"
                        : isCurrent
                        ? "bg-[#1B4D2E] border-[#1B4D2E] text-white shadow-sm cursor-pointer"
                        : "bg-white border-[#E8E2D5] hover:border-[#1B4D2E] hover:bg-[#EAF2EC] text-[#163E24] shadow-2xs hover:shadow-xs cursor-pointer group"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isOccupied
                            ? "text-rose-700 font-bold"
                            : isCurrent
                            ? "text-white/80"
                            : "text-[#6E7B6C]"
                        }`}
                      >
                        {isOccupied ? "Occupied" : t.capacity ? `${t.capacity} Seats` : "Table"}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOccupied
                            ? "bg-rose-500"
                            : isCurrent
                            ? "bg-white"
                            : "bg-emerald-600 group-hover:scale-125 transition-transform"
                        }`}
                      />
                    </div>

                    <div>
                      <p
                        className={`font-serif font-bold text-base leading-tight ${
                          isOccupied
                            ? "text-stone-600"
                            : isCurrent
                            ? "text-white"
                            : "text-[#163E24] group-hover:text-[#1B4D2E]"
                        }`}
                      >
                        {t.name}
                      </p>

                      <p className="text-[10px] mt-1 font-semibold">
                        {isOccupied ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <span>Not Available</span>
                          </span>
                        ) : isCurrent ? (
                          <span className="text-white/90">Current Table ✓</span>
                        ) : (
                          <span className="text-emerald-700 font-bold flex items-center justify-between">
                            <span>Available</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Select →</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#E8E2D5] mt-3 flex items-center justify-between text-xs text-[#7A8578]">
          <span>Not seated at a table yet?</span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold text-[#163E24] hover:underline"
          >
            Close & Browse
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
