import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { SearchableGrid } from "@/components/catalog/SearchableGrid";
import { CartButton } from "@/components/catalog/CartButton";
import { SearchProvider } from "@/context/SearchContext";
import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getProducts(
  category: string,
  size: string,
  price: string,
  sort: string
) {
  const where: Prisma.ProductWhereInput = {
    isVisible: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(size ? { sizes: { some: { size, stock: { gt: 0 } } } } : {}),
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

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
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
  }>;
}) {
  const {
    search   = "",
    category = "",
    size     = "",
    price    = "",
    sort     = "",
  } = await searchParams;

  const [products, categories] = await Promise.all([
    getProducts(category, size, price, sort),
    getCategories(),
  ]);

  const hasServerFilters = !!(category || size || price || sort);

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
              <CatalogFilters categories={categories} />
            </Suspense>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <SearchableGrid products={serialized} hasServerFilters={hasServerFilters} />
        </main>

        {/* Footer */}
        <footer className="bg-brand-darker border-t border-gold-800/30 mt-16 py-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Image
              src="/logo.png"
              alt="Masterpiece CTG"
              width={180}
              height={50}
              className="h-10 w-auto object-contain mx-auto mb-3 opacity-80"
            />
            <p className="text-gold-500 text-sm">Cartagena de Indias, Colombia 🇨🇴</p>
          </div>
        </footer>
      </div>
    </SearchProvider>
  );
}
