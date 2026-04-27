import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ProductActions } from "@/components/admin/ProductActions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

async function getProducts(search: string, category: string, page: number) {
  const where = {
    ...(search   ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(category ? { category: { slug: category } } : {}),
  };
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images:   { orderBy: { order: "asc" }, take: 1 },
        sizes:    true,
      },
      orderBy: { createdAt: "desc" },
      take:    PAGE_SIZE,
      skip:    (page - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  return { products, total };
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}) {
  const { search = "", category = "", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const [{ products, total }, categories] = await Promise.all([
    getProducts(search, category, page),
    getCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (search)   params.set("search",   search);
    if (category) params.set("category", category);
    params.set("page", String(p));
    return `/admin/productos?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} artículo{total !== 1 ? "s" : ""}
            {totalPages > 1 && ` — página ${page} de ${totalPages}`}
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
            placeholder="Buscar artículo..."
            className="pl-9 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          name="category"
          defaultValue={category}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <input type="hidden" name="page" value="1" />
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {/* Products table */}
      {products.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search || category ? "Sin resultados" : "No hay artículos"}
          </p>
          {!search && !category && (
            <Button asChild className="mt-4 bg-amber-500 hover:bg-amber-600 text-white">
              <Link href="/admin/productos/nuevo">Agregar primer artículo</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Artículo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Precio</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button
                  asChild={page > 1}
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                >
                  {page > 1 ? (
                    <Link href={pageUrl(page - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Link>
                  ) : (
                    <span>
                      <ChevronLeft className="h-4 w-4 mr-1 inline" />
                      Anterior
                    </span>
                  )}
                </Button>

                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "…" ? (
                        <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-muted-foreground">…</span>
                      ) : (
                        <Button
                          key={item}
                          asChild={item !== page}
                          size="sm"
                          variant={item === page ? "default" : "outline"}
                          className={item === page ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                        >
                          {item !== page ? (
                            <Link href={pageUrl(item as number)}>{item}</Link>
                          ) : (
                            <span>{item}</span>
                          )}
                        </Button>
                      )
                    )}
                </div>

                <Button
                  asChild={page < totalPages}
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                >
                  {page < totalPages ? (
                    <Link href={pageUrl(page + 1)}>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <span>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1 inline" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
