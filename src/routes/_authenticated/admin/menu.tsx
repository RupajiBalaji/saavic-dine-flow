import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Check,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { getLists, saveProduct, deleteProduct, setProductStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: MenuManagementPage,
});

type ProductStatus = "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";

function MenuManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const listsFn = useServerFn(getLists);
  const saveProductFn = useServerFn(saveProduct);
  const setStatusFn = useServerFn(setProductStatus);

  const listsQuery = useQuery({
    queryKey: ["admin-lists"],
    queryFn: () => listsFn(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await saveProductFn({ data: payload });
    },
    onSuccess: () => {
      toast.success("Dish saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-lists"] });
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save dish"),
  });

  const statusMutation = useMutation({
    mutationFn: async (vars: { id: string; status: ProductStatus }) => {
      return await setStatusFn({ data: vars });
    },
    onSuccess: (_, vars) => {
      const msg =
        vars.status === "AVAILABLE"
          ? "Dish unhidden & live on customer menu! ✓"
          : vars.status === "OUT_OF_STOCK"
          ? "Dish marked Out of Stock"
          : "Dish hidden from customer menu";
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["admin-lists"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update dish status"),
  });

  const categories = listsQuery.data?.categories ?? [];
  const products = listsQuery.data?.products ?? [];

  const filteredProducts = products.filter((p: any) => {
    if (selectedCat !== "ALL" && p.category_id !== selectedCat) return false;
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description ?? "").toLowerCase().includes(term) ||
      (p.ingredients ?? "").toLowerCase().includes(term)
    );
  });

  const hiddenCount = products.filter((p: any) => p.status === "HIDDEN").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7 text-emerald-600" />
            Menu Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your café's healthy dishes, smoothies, meal plans, prices, and availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            onClick={() => {
              setEditingProduct({
                name: "",
                slug: "",
                price: 149,
                status: "AVAILABLE",
                category_id: categories[0]?.id ?? "",
                description: "",
                ingredients: "",
              });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Dish
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-muted/30 border-border/80">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes, smoothies, salads..."
                className="pl-9 bg-background text-sm"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Status:</span>
              <Button
                size="sm"
                variant={statusFilter === "ALL" ? "default" : "outline"}
                onClick={() => setStatusFilter("ALL")}
                className="h-7 text-xs px-2.5"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "AVAILABLE" ? "default" : "outline"}
                onClick={() => setStatusFilter("AVAILABLE")}
                className="h-7 text-xs px-2.5"
              >
                Active
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "HIDDEN" ? "default" : "outline"}
                onClick={() => setStatusFilter("HIDDEN")}
                className="h-7 text-xs px-2.5 gap-1"
              >
                Hidden
                {hiddenCount > 0 && (
                  <Badge variant="secondary" className="px-1 py-0 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    {hiddenCount}
                  </Badge>
                )}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "OUT_OF_STOCK" ? "default" : "outline"}
                onClick={() => setStatusFilter("OUT_OF_STOCK")}
                className="h-7 text-xs px-2.5"
              >
                Sold Out
              </Button>
            </div>
          </div>

          {/* Category Filter Badges */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/60">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Category:</span>
            <Button
              size="sm"
              variant={selectedCat === "ALL" ? "secondary" : "ghost"}
              onClick={() => setSelectedCat("ALL")}
              className="h-7 text-xs px-2.5"
            >
              All
            </Button>
            {categories.map((c: any) => (
              <Button
                key={c.id}
                size="sm"
                variant={selectedCat === c.id ? "secondary" : "ghost"}
                onClick={() => setSelectedCat(c.id)}
                className="h-7 text-xs px-2.5"
              >
                {c.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {listsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-dashed py-12 text-center bg-muted/20">
          <CardContent className="space-y-2">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="font-display font-semibold">No Dishes Found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your category or status filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod: any) => {
            const cat = categories.find((c: any) => c.id === prod.category_id);
            const isAvailable = prod.status === "AVAILABLE";
            const isHidden = prod.status === "HIDDEN";
            const isOutOfStock = prod.status === "OUT_OF_STOCK";

            return (
              <Card
                key={prod.id}
                className={`flex flex-col justify-between transition-all border-2 ${
                  isHidden
                    ? "border-amber-500/40 bg-amber-500/5 opacity-80"
                    : isOutOfStock
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border"
                }`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-bold text-base text-foreground">{prod.name}</h4>
                      {cat && <Badge variant="secondary" className="text-[10px] mt-0.5">{cat.name}</Badge>}
                    </div>
                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                      {inr(prod.price)}
                    </span>
                  </div>

                  {prod.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{prod.description}</p>
                  )}

                  {prod.ingredients && (
                    <p className="text-[11px] text-muted-foreground/80">
                      <strong className="text-foreground">Ingredients:</strong> {prod.ingredients}
                    </p>
                  )}
                </CardContent>

                <div className="p-4 pt-0 border-t border-border/40 mt-2 flex items-center justify-between gap-2">
                  {/* Status Badge */}
                  <div>
                    {isAvailable && (
                      <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px]">
                        Available
                      </Badge>
                    )}
                    {isHidden && (
                      <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[11px]">
                        Hidden (Off Menu)
                      </Badge>
                    )}
                    {isOutOfStock && (
                      <Badge variant="destructive" className="text-[11px]">
                        Sold Out
                      </Badge>
                    )}
                  </div>

                  {/* Actions: Out of Stock / Unhide / Hide / Edit */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Fast Out of Stock toggle */}
                    {isOutOfStock ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 gap-1"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: prod.id, status: "AVAILABLE" })}
                        title="Mark dish as In Stock & Available"
                      >
                        <Check className="h-3.5 w-3.5" />
                        In Stock
                      </Button>
                    ) : isAvailable ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-xs font-medium text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/10 gap-1"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: prod.id, status: "OUT_OF_STOCK" })}
                        title="Mark dish Out of Stock (86)"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        86 Out
                      </Button>
                    ) : null}

                    {isHidden ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 gap-1"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: prod.id, status: "AVAILABLE" })}
                        title="Unhide dish and show on menu"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Unhide
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 gap-1"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: prod.id, status: "HIDDEN" })}
                        title="Hide dish from customer menu"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Hide
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setEditingProduct(prod);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create Dish Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct?.id ? "Edit Dish" : "Add New Dish"}</DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-3 py-2 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Dish Name</label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setEditingProduct({ ...editingProduct, name, slug: editingProduct.slug || slug });
                  }}
                  placeholder="e.g. Avocado Toast"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Price (₹)</label>
                  <Input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={editingProduct.category_id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Menu Availability Status</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={editingProduct.status ?? "AVAILABLE"}
                  onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE (Active on customer QR menu)</option>
                  <option value="OUT_OF_STOCK">OUT OF STOCK (Shown as Sold Out)</option>
                  <option value="HIDDEN">HIDDEN (Completely off customer menu)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
                <Input
                  value={editingProduct.description ?? ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Short appetizing description"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Ingredients</label>
                <Input
                  value={editingProduct.ingredients ?? ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, ingredients: e.target.value })}
                  placeholder="e.g. Smashed avocado, rye bread, chia seeds"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!editingProduct.name || !editingProduct.price || saveMutation.isPending}
                  onClick={() => saveMutation.mutate(editingProduct)}
                >
                  Save Dish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
