"use client";

import { useMemo } from "react";
import { Package } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useSearch } from "@/context/SearchContext";

interface ProductSize {
  size: string;
  stock: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  createdAt: string;
  category: { name: string };
  images: { url: string }[];
  sizes: ProductSize[];
}

interface Props {
  products: CatalogProduct[];
  hasServerFilters: boolean;
}

export function SearchableGrid({ products, hasServerFilters }: Props) {
  const { search } = useSearch();

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q)
    );
  }, [products, search]);

  const hasFilters = hasServerFilters || search.trim();

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">
            {hasFilters ? "Resultados" : "Colección"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {hasFilters
              ? `${filtered.length} producto${filtered.length !== 1 ? "s" : ""}${
                  search ? ` para "${search}"` : ""
                }`
              : `${filtered.length} artículo${filtered.length !== 1 ? "s" : ""} disponible${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {hasFilters && filtered.length !== products.length && (
          <span className="text-xs text-gold-600 font-medium">
            {filtered.length} de {products.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <Package className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400">Sin resultados</h2>
          <p className="text-gray-400 mt-2 text-sm">Intenta con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
