import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ProductActions } from "@/components/admin/ProductActions";

export const dynamic = "force-dynamic";

async function getProducts(search: string, category: string) {
  return prisma.product.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category: { slug: category } } : {}),
    },
    include: {
      category: true,
      images: { orderBy: { order: "asc" }, take: 1 },
      sizes: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search = "", category = "" } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(search, category),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} articulo{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
          <Link href="/admin/productos/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <form className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar articulo..."
            className="pl-9 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          name="category"
          defaultValue={category}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas las categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {/* Products table */}
      {products.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay articulos</p>
          <Button asChild className="mt-4 bg-amber-500 hover:bg-amber-600 text-white">
            <Link href="/admin/productos/nuevo">Agregar primer articulo</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Articulo
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Categoria
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Precio
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Stock
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => {
                const totalStock = product.sizes.reduce(
                  (sum, s) => sum + s.stock,
                  0
                );
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {product.category.name}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatPrice(Number(product.price))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {totalStock} ud
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          !product.isVisible
                            ? "secondary"
                            : totalStock === 0
                            ? "destructive"
                            : totalStock <= 3
                            ? "warning"
                            : "success"
                        }
                      >
                        {!product.isVisible
                          ? "Oculto"
                          : totalStock === 0
                          ? "Agotado"
                          : totalStock <= 3
                          ? "Stock bajo"
                          : "Disponible"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ProductActions productId={product.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
