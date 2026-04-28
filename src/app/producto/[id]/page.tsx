import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CartButton } from "@/components/catalog/CartButton";
import { ProductClient } from "./ProductClient";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!product) return { title: "Producto no encontrado — Masterpiece CTG" };
  return {
    title: `${product.name} — Masterpiece CTG`,
    description:
      product.description ??
      `Compra ${product.name} en Masterpiece CTG, Cartagena de Indias.`,
    openGraph: {
      title: product.name,
      images: product.images[0]?.url ? [product.images[0].url] : [],
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

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
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

      {/* Footer */}
      <footer className="bg-brand-darker border-t border-gold-800/30 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Image
            src="/logo.png"
            alt="Masterpiece CTG"
            width={160}
            height={44}
            className="h-9 w-auto object-contain mx-auto mb-2 opacity-80"
          />
          <p className="text-gold-500 text-xs">Cartagena de Indias, Colombia 🇨🇴</p>
        </div>
      </footer>
    </div>
  );
}
