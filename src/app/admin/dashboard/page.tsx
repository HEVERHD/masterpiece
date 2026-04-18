import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import {
  Package,
  AlertTriangle,
  EyeOff,
  CheckCircle,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 3;

async function getStats() {
  const [products, lowStockProducts] = await Promise.all([
    prisma.product.findMany({
      include: {
        sizes: true,
        images: { orderBy: { order: "asc" }, take: 1 },
        category: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({
      where: {
        isVisible: true,
        sizes: {
          some: {
            stock: { gt: 0, lte: LOW_STOCK_THRESHOLD },
          },
        },
      },
      include: { sizes: true, category: true, images: { take: 1 } },
      take: 5,
    }),
  ]);

  const total = products.length;
  const visible = products.filter((p) => p.isVisible).length;
  const hidden = products.filter((p) => !p.isVisible).length;

  const withLowStock = products.filter(
    (p) =>
      p.isVisible &&
      p.sizes.some((s) => s.stock > 0 && s.stock <= LOW_STOCK_THRESHOLD)
  ).length;

  return { total, visible, hidden, withLowStock, products, lowStockProducts };
}

export default async function DashboardPage() {
  const { total, visible, hidden, withLowStock, products, lowStockProducts } =
    await getStats();

  const stats = [
    {
      title: "Total Articulos",
      value: total,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Visibles",
      value: visible,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Ocultos",
      value: hidden,
      icon: EyeOff,
      color: "text-gray-500",
      bg: "bg-gray-100",
    },
    {
      title: "Stock Bajo",
      value: withLowStock,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Resumen de tu inventario
          </p>
        </div>
        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
          <Link href="/admin/productos/nuevo">
            <Plus className="h-4 w-4" />
            Agregar articulo
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => {
                const lowSizes = product.sizes.filter(
                  (s) => s.stock > 0 && s.stock <= LOW_STOCK_THRESHOLD
                );
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {lowSizes.map((s) => (
                          <Badge key={s.size} variant="warning">
                            {s.size}: {s.stock} ud
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Link href={`/admin/productos/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent products */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Articulos Recientes</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/productos">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products.slice(0, 8).map((product) => {
              const totalStock = product.sizes.reduce(
                (sum, s) => sum + s.stock,
                0
              );
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">
                      {formatPrice(Number(product.price))}
                    </span>
                    <Badge
                      variant={
                        !product.isVisible
                          ? "secondary"
                          : totalStock === 0
                          ? "destructive"
                          : totalStock <= LOW_STOCK_THRESHOLD
                          ? "warning"
                          : "success"
                      }
                    >
                      {!product.isVisible
                        ? "Oculto"
                        : totalStock === 0
                        ? "Agotado"
                        : totalStock <= LOW_STOCK_THRESHOLD
                        ? "Stock bajo"
                        : "Disponible"}
                    </Badge>
                    <Link href={`/admin/productos/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
