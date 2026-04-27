import { ProductCardSkeleton } from "@/components/catalog/ProductCardSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header placeholder */}
      <div className="bg-brand-darker border-b border-gold-800/30 h-[120px] sticky top-0 z-40 shadow-lg" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Section header skeleton */}
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-1.5">
            <div className="h-5 bg-stone-200 rounded w-24 animate-pulse" />
            <div className="h-3 bg-stone-100 rounded w-32 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
