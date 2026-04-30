import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { SearchableGrid } from "@/components/catalog/SearchableGrid";
import { CartButton } from "@/components/catalog/CartButton";
import { SiteFooter } from "@/components/catalog/SiteFooter";
import { HeroCarouselSection } from "@/components/catalog/HeroCarouselSection";
import { TrustBar } from "@/components/catalog/TrustBar";
import { CategoryCards } from "@/components/catalog/CategoryCards";
import { PromoBanner } from "@/components/catalog/PromoBanner";
import { SearchProvider } from "@/context/SearchContext";
import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getProducts(
  category: string,
  size: string,
  price: string,
  sort: string,
  color: string
) {
  const where: Prisma.ProductWhereInput = {
    isVisible: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(size ? { sizes: { some: { size, stock: { gt: 0 } } } } : {}),
    ...(color ? { color } : {}),
    ...(price === "lt50000"
      ? { price: { lt: 50000 } }
      : price === "50-100"
      ? { price: { gte: 50000, lte: 100000 } }
      : price === "gt100000"
      ? { price: { gt: 100000 } }
      : {}),
  };

  const include = {
    category: true,
    images: { orderBy: { order: "asc" } as const },
    sizes:   { orderBy: { size:  "asc" } as const },
  };

  if (sort === "popular") {
    const products = await prisma.product.findMany({ where, include });
    if (products.length === 0) return products;
    const counts = await prisma.order.groupBy({
      by: ["productId"],
      _count: { id: true },
      where: { productId: { in: products.map((p) => p.id) } },
    });
    const countMap = new Map(counts.map((o) => [o.productId!, o._count.id]));
    return products.sort((a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0));
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"  ? { price: "asc"  } :
    sort === "price_desc" ? { price: "desc" } :
                            { createdAt: "desc" };

  return prisma.product.findMany({ where, include, orderBy });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    size?: string;
    price?: string;
    sort?: string;
    color?: string;
  }>;
}) {
  const {
    search   = "",
    category = "",
    size     = "",
    price    = "",
    sort     = "",
    color    = "",
  } = await searchParams;

  const [products, categories, featuredRaw, categoriesWithImages] = await Promise.all([
    getProducts(category, size, price, sort, color),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { isVisible: true },
      include: {
        category: true,
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        products: {
          where: { isVisible: true },
          include: { images: { orderBy: { order: "asc" }, take: 1 } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const featured = featuredRaw.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  const categoryCards = categoriesWithImages
    .filter((c) => c.products.length > 0)
    .map((c) => ({
      name:     c.name,
      slug:     c.slug,
      imageUrl: c.products[0]?.images[0]?.url ?? null,
    }));

  const hasServerFilters = !!(category || size || price || sort || color);

  const availableColors = [...new Set(
    products.map((p) => p.color).filter((c): c is string => !!c)
  )];

  const serialized = products.map((p) => ({
    ...p,
    price:     Number(p.price),
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <SearchProvider initialSearch={search}>
      <div className="min-h-screen bg-[#F7F4EF]">
        {/* Header */}
        <header className="bg-brand-darker border-b border-gold-800/30 sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <Image
                src="/logo.png"
                alt="Masterpiece CTG"
                width={220}
                height={60}
                className="h-12 w-auto object-contain"
                priority
              />
              <div className="flex items-center gap-2">
                <CartButton />
                <Link
                  href="/admin/login"
                  className="text-xs text-gold-700 hover:text-gold-500 transition-colors px-2 py-1 rounded border border-gold-800/40 hover:border-gold-700/60"
                >
                  admin
                </Link>
              </div>
            </div>

            <Suspense fallback={<div className="h-[88px] bg-gold-900/20 rounded-2xl animate-pulse" />}>
              <CatalogFilters categories={categories} availableColors={availableColors} />
            </Suspense>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">

          {!hasServerFilters && (
            <>
              {/* A — Carousel */}
              <HeroCarouselSection products={featured} />

              {/* A — Trust bar */}
              <TrustBar />

              {/* B — Categorías visuales */}
              <CategoryCards categories={categoryCards} />

              {/* D — Promo banner */}
              <PromoBanner />
            </>
          )}

          {/* C — Encabezado de sección */}
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-800 tracking-tight">
                {hasServerFilters || search ? "Resultados" : "Nueva Colección"}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {serialized.length} producto{serialized.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <SearchableGrid products={serialized} hasServerFilters={hasServerFilters} />
        </main>

        <SiteFooter />
      </div>
    </SearchProvider>
  );
}
