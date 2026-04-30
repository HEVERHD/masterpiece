import Image from "next/image";
import Link from "next/link";

interface CategoryCardData {
  name: string;
  slug: string;
  imageUrl: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  gorras:      "from-blue-900 to-blue-700",
  bermudas:    "from-emerald-900 to-emerald-700",
  boxer:       "from-purple-900 to-purple-700",
  camisetas:   "from-rose-900 to-rose-700",
  accesorios:  "from-amber-900 to-amber-700",
  jeans:       "from-indigo-900 to-indigo-700",
};

export function CategoryCards({ categories }: { categories: CategoryCardData[] }) {
  if (categories.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-bold text-stone-700 uppercase tracking-widest mb-3">
        Categorías
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {categories.map((cat) => {
          const gradient = CATEGORY_COLORS[cat.slug] ?? "from-stone-900 to-stone-700";
          return (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              className="flex-shrink-0 relative w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform"
            >
              {/* Imagen o gradiente */}
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

              {/* Nombre */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-white font-bold text-[11px] leading-tight text-center">
                  {cat.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
