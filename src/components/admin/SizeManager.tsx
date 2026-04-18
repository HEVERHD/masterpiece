"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Unico"];

interface SizeEntry {
  size: string;
  stock: number;
}

interface SizeManagerProps {
  sizes: SizeEntry[];
  onChange: (sizes: SizeEntry[]) => void;
}

export function SizeManager({ sizes, onChange }: SizeManagerProps) {
  const [customSize, setCustomSize] = useState("");

  const addSize = (sizeName: string) => {
    const name = sizeName.trim().toUpperCase();
    if (!name) return;
    if (sizes.find((s) => s.size === name)) return;
    onChange([...sizes, { size: name, stock: 0 }]);
    setCustomSize("");
  };

  const removeSize = (size: string) => {
    onChange(sizes.filter((s) => s.size !== size));
  };

  const updateStock = (size: string, stock: number) => {
    onChange(
      sizes.map((s) =>
        s.size === size ? { ...s, stock: Math.max(0, stock) } : s
      )
    );
  };

  const availablePresets = PRESET_SIZES.filter(
    (s) => !sizes.find((existing) => existing.size === s)
  );

  return (
    <div className="space-y-4">
      {/* Preset sizes */}
      {availablePresets.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Tallas rapidas:
          </p>
          <div className="flex flex-wrap gap-2">
            {availablePresets.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => addSize(size)}
                className="px-3 py-1 text-xs border rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                + {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom size */}
      <div className="flex gap-2">
        <Input
          placeholder="Talla personalizada (ej: 32)"
          value={customSize}
          onChange={(e) => setCustomSize(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSize(customSize);
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addSize(customSize)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Size entries */}
      {sizes.length > 0 && (
        <div className="space-y-2">
          {sizes.map(({ size, stock }) => (
            <div
              key={size}
              className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
            >
              <span className="font-medium text-sm w-16">{size}</span>
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => updateStock(size, stock - 1)}
                  className="w-7 h-7 rounded border flex items-center justify-center text-sm hover:bg-gray-200 transition-colors"
                >
                  −
                </button>
                <Input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) =>
                    updateStock(size, parseInt(e.target.value) || 0)
                  }
                  className="w-20 text-center h-8 text-sm"
                />
                <button
                  type="button"
                  onClick={() => updateStock(size, stock + 1)}
                  className="w-7 h-7 rounded border flex items-center justify-center text-sm hover:bg-gray-200 transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-muted-foreground">unidades</span>
              </div>
              <button
                type="button"
                onClick={() => removeSize(size)}
                className="text-red-400 hover:text-red-600 transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {sizes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
          Agrega las tallas disponibles
        </p>
      )}
    </div>
  );
}
