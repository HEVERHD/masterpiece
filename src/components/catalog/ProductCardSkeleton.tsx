export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-stone-100 animate-pulse flex flex-col">
      <div className="aspect-[3/4] bg-stone-200" />
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="h-2.5 bg-stone-200 rounded w-16" />
        <div className="h-4 bg-stone-200 rounded w-full" />
        <div className="h-3 bg-stone-200 rounded w-3/4" />
        <div className="flex gap-1 mt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-7 bg-stone-100 rounded" />
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-auto">
          <div className="h-4 bg-stone-200 rounded w-16" />
          <div className="h-7 bg-stone-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
}
