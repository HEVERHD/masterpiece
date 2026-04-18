import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const productForForm = {
    ...product,
    price: Number(product.price),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/productos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold">Editar: {product.name}</h1>
      </div>
      <ProductForm categories={categories} product={productForForm} />
    </div>
  );
}
