"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X, ArrowUpDown } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { PRODUCT_COLORS } from "@/lib/colors";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CatalogFiltersProps {
  categories: Category[];
  availableColors?: string[];
}

const PRICE_OPTIONS = [
  { label: "< $50k",       value: "lt50000"  },
  { label: "$50k – $100k", value: "50-100"   },
  { label: "> $100k",      value: "gt100000" },
];

const SORT_OPTIONS = [
  { label: "Más recientes", value: ""           },
  { label: "Menor precio",  value: "price_asc"  },
  { label: "Mayor precio",  value: "price_desc" },
  { label: "Más pedidos",   value: "popular"    },
];

export function CatalogFilters({ categories, availableColors = [] }: CatalogFiltersProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { search, setSearch } = useSearch();

  const category = searchParams.get("category") ?? "";
  const size     = searchParams.get("size")     ?? "";
  const price    = searchParams.get("price")    ?? "";
  const sort     = searchParams.get("sort")     ?? "";
  const color    = searchParams.get("color")    ?? "";

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

  function clearAll() {
    setSearch("");
    router.push("/");
  }

  const visibleColors = PRODUCT_COLORS.filter((c) =>
    availableColors.includes(c.value)
  );

  const hasFilters = search || category || size || price || sort || color;

  return (
    <div className="space-y-2.5">
      {/* Row 1: Search + Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-500" />
          <input
            type="text"
            placeholder="Buscar artículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 h-11 rounded-xl border border-gold-800/40 bg-brand-dark/60 text-gold-100 placeholder:text-gold-700 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-600 hover:text-gold-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-500 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="h-11 pl-9 pr-8 rounded-xl border border-gold-800/40 bg-brand-dark/60 text-gold-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-stone-900 text-gold-100">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Category pills + Price pills + Clear */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => updateFilter("category", "")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
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
            onClick={() => updateFilter("category", category === cat.slug ? "" : cat.slug)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              category === cat.slug
                ? "bg-gold-500 text-brand-darker border-gold-500"
                : "bg-transparent text-gold-400 border-gold-800/50 hover:border-gold-500"
            }`}
          >
            {cat.name}
          </button>
        ))}

        {categories.length > 0 && (
          <span className="flex-shrink-0 w-px bg-gold-800/30 self-stretch mx-1" />
        )}

        {PRICE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateFilter("price", price === opt.value ? "" : opt.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              price === opt.value
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-transparent text-gold-400 border-gold-800/50 hover:border-amber-500/60"
            }`}
          >
            {opt.label}
          </button>
        ))}

        {/* Color dots */}
        {visibleColors.length > 0 && (
          <span className="flex-shrink-0 w-px bg-gold-800/30 self-stretch mx-1" />
        )}
        {visibleColors.map((c) => (
          <button
            key={c.value}
            onClick={() => updateFilter("color", color === c.value ? "" : c.value)}
            title={c.label}
            className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              color === c.value
                ? "border-white/80 bg-white/10"
                : "border-gold-800/50 hover:border-white/40"
            }`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-gold-300 text-[11px]">{c.label}</span>
          </button>
        ))}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-gold-600 hover:text-gold-400 border border-dashed border-gold-800/50 hover:border-gold-600 transition-colors"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
