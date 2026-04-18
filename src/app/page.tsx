import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Package, ShoppingBag } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getProducts(search: string, category: string, size: string) {
  return prisma.product.findMany({
    where: {
      isVisible: true,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(size ? { sizes: { some: { size, stock: { gt: 0 } } } } : {}),
    },
    include: {
      category: true,
      images: { orderBy: { order: "asc" } },
      sizes: { orderBy: { size: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; size?: string }>;
}) {
  const { search = "", category = "", size = "" } = await searchParams;

  const [products, categories] = await Promise.all([
    getProducts(search, category, size),
    getCategories(),
  ]);

  const hasFilters = search || category || size;

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <header className="bg-brand-darker border-b border-gold-800/30 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Masterpiece CTG"
                width={220}
                height={60}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-2 text-gold-400">
              <ShoppingBag className="h-5 w-5" />
              <span className="text-sm font-medium">
                {products.length} disponible{products.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <Suspense fallback={<div className="h-12 bg-gold-900/20 rounded-2xl animate-pulse" />}>
            <CatalogFilters categories={categories} />
          </Suspense>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <Package className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400">
              {hasFilters
                ? "No hay resultados para esta busqueda"
                : "El catalogo esta vacio"}
            </h2>
            <p className="text-gray-400 mt-2 text-sm">
              {hasFilters
                ? "Intenta con otros filtros"
                : "Vuelve pronto, estamos actualizando el inventario"}
            </p>
          </div>
        ) : (
          <>
            {hasFilters && (
              <p className="text-sm text-muted-foreground mb-4">
                {products.length} resultado{products.length !== 1 ? "s" : ""}
                {search && (
                  <span>
                    {" "}
                    para <span className="font-medium">&ldquo;{search}&rdquo;</span>
                  </span>
                )}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    price: Number(product.price),
                  }}
                />
              ))}
            </div>
          </>
        )}
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
  );
}
