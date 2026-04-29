import { prisma } from "@/lib/prisma";
import { ExportClient } from "./ExportClient";

export default async function ExportarPage() {
  const products = await prisma.product.findMany({
    where: { isVisible: true },
    include: {
      category: true,
      images: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    category: p.category.name,
    image: p.images[0]?.url ?? null,
  }));

  return <ExportClient products={serialized} />;
}
