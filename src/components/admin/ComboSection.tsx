"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Plus, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

export function ComboSection({
  productId,
  allProducts,
}: {
  productId: string;
  allProducts: { id: string; name: string; price: number }[];
}) {
  const [combos,   setCombos]   = useState<SimpleProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    fetch(`/api/admin/combos?productId=${productId}`)
      .then((r) => r.json())
      .then(setCombos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const available = allProducts.filter(
    (p) => p.id !== productId && !combos.find((c) => c.id === p.id)
  );

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/combos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId, relatedId: selected }),
      });
      if (!res.ok) throw new Error();
      const added = allProducts.find((p) => p.id === selected)!;
      setCombos((prev) => [...prev, { ...added, imageUrl: null }]);
      setSelected("");
      toast.success("Producto agregado al look");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(relatedId: string) {
    try {
      const res = await fetch("/api/admin/combos", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId, relatedId }),
      });
      if (!res.ok) throw new Error();
      setCombos((prev) => prev.filter((c) => c.id !== relatedId));
      toast.success("Eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="border rounded-xl p-5 space-y-4 bg-white">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h3 className="font-semibold text-sm">Completa el look</h3>
        <span className="text-xs text-muted-foreground ml-1">
          — Productos que combinan con este
        </span>
      </div>

      {/* Add */}
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 h-9 rounded-md border border-input px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-white"
        >
          <option value="">Selecciona un producto...</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatPrice(p.price)}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selected || saving}
          className="flex items-center gap-1.5 px-4 h-9 rounded-md bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : combos.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
          Sin productos combinados aún
        </p>
      ) : (
        <div className="space-y-2">
          {combos.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-amber-600">{formatPrice(c.price)}</p>
              </div>
              <button
                onClick={() => handleRemove(c.id)}
                className="p-1 text-stone-300 hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
