"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Unico"];

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CatalogFiltersProps {
  categories: Category[];
}

export function CatalogFilters({ categories }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const size = searchParams.get("size") ?? "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => router.push("/");
  const hasFilters = search || category || size;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-500" />
        <input
          type="text"
          placeholder="Buscar articulo..."
          defaultValue={search}
          onChange={(e) => {
            const val = e.target.value;
            const timeout = setTimeout(() => updateFilter("search", val), 400);
            return () => clearTimeout(timeout);
          }}
          className="w-full pl-12 pr-4 h-11 rounded-xl border border-gold-800/40 bg-brand-dark/60 text-gold-100 placeholder:text-gold-700 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
        />
      </div>

      {/* Category & Size filters row */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => updateFilter("category", "")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              !category
                ? "bg-gold-500 text-brand-darker border-gold-500"
                : "bg-transparent text-gold-400 border-gold-800/50 hover:border-gold-500"
            }`}
          >
            Todo
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                updateFilter("category", category === cat.slug ? "" : cat.slug)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                category === cat.slug
                  ? "bg-gold-500 text-brand-darker border-gold-500"
                  : "bg-transparent text-gold-400 border-gold-800/50 hover:border-gold-500"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Size filter */}
        <div className="flex gap-1 flex-wrap">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => updateFilter("size", size === s ? "" : s)}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition-all border ${
                size === s
                  ? "bg-gold-500 text-brand-darker border-gold-500"
                  : "bg-transparent text-gold-400 border-gold-800/50 hover:border-gold-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-gold-600 hover:text-gold-400 border border-dashed border-gold-800/50 hover:border-gold-600 transition-colors"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
