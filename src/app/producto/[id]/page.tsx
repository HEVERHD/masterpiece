import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CartButton } from "@/components/catalog/CartButton";
import { ProductClient } from "./ProductClient";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SiteFooter } from "@/components/catalog/SiteFooter";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const BASE_URL = "https://masterpiecectg.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { order: "asc" }, take: 1 },
    },
  });
  if (!product) return { title: "Producto no encontrado" };

  const price    = Number(product.price).toLocaleString("es-CO");
  const imageUrl = product.images[0]?.url;
  const desc     = product.description
    ?? `Compra ${product.name} en Masterpiece CTG, Cartagena de Indias. Precio: $${price} COP. Pide por WhatsApp con domicilio.`;

  return {
    title: product.name,
    description: desc,
    alternates: { canonical: `${BASE_URL}/producto/${id}` },
    openGraph: {
      type: "website",
      title: `${product.name} | Masterpiece CTG`,
      description: desc,
      url: `${BASE_URL}/producto/${id}`,
      siteName: "Masterpiece CTG",
      locale: "es_CO",
      images: imageUrl
        ? [{ url: imageUrl, alt: product.name, width: 800, height: 1067 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Masterpiece CTG`,
      description: desc,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id, isVisible: true },
    include: {
      category: true,
      images:   { orderBy: { order: "asc" } },
      sizes:    { orderBy: { size:  "asc" } },
      combos: {
        include: {
          related: {
            include: {
              images:   { orderBy: { order: "asc" } },
              category: true,
              sizes:    { orderBy: { size: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isVisible:  true,
      id:         { not: product.id },
    },
    include: {
      category: true,
      images:   { orderBy: { order: "asc" } },
      sizes:    { orderBy: { size:  "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const serialized = {
    ...product,
    price:     Number(product.price),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  const relatedSerialized = related.map((p) => ({
    ...p,
    price:     Number(p.price),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const combosSerialized = product.combos
    .filter((c) => c.related.isVisible)
    .map((c) => ({
      ...c.related,
      price:     Number(c.related.price),
      createdAt: c.related.createdAt.toISOString(),
      updatedAt: c.related.updatedAt.toISOString(),
    }));

  const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ??
      `${product.name} disponible en Masterpiece CTG, Cartagena de Indias.`,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "Masterpiece CTG" },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/producto/${product.id}`,
      priceCurrency: "COP",
      price: Number(product.price).toFixed(0),
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Masterpiece CTG" },
    },
    category: product.category.name,
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Header */}
      <header className="bg-brand-darker border-b border-gold-800/30 sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gold-400 hover:text-gold-200 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Catálogo
          </Link>
          <CartButton />
        </div>
      </header>

      {/* Product detail */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <ProductClient product={serialized} />

        {/* Completa el look */}
        {combosSerialized.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-bold text-gray-700 mb-1 tracking-tight">
              ✨ Completa el look
            </h2>
            <p className="text-xs text-stone-400 mb-4">Productos que combinan perfecto con este</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {combosSerialized.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Related products */}
        {relatedSerialized.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-bold text-gray-700 mb-4 tracking-tight">
              También te puede gustar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {relatedSerialized.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
