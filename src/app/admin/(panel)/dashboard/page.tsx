import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import {
  Package, AlertTriangle, EyeOff, CheckCircle,
  Plus, ShoppingBag, TrendingUp, Clock, XCircle, Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 3;

function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
}

async function getStats() {
  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      include: {
        sizes: true,
        images: { orderBy: { order: "asc" }, take: 1 },
        category: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const totalProducts = products.length;
  const visible       = products.filter((p) => p.isVisible).length;
  const hidden        = products.filter((p) => !p.isVisible).length;
  const withLowStock  = products.filter(
    (p) => p.isVisible && p.sizes.some((s) => s.stock > 0 && s.stock <= LOW_STOCK_THRESHOLD)
  ).length;
  const lowStockProducts = products
    .filter((p) => p.isVisible && p.sizes.some((s) => s.stock > 0 && s.stock <= LOW_STOCK_THRESHOLD))
    .slice(0, 5);

  const pendiente = orders.filter((o) => o.status === "PENDIENTE").length;
  const pagado    = orders.filter((o) => o.status === "PAGADO").length;
  const enviado   = orders.filter((o) => o.status === "ENVIADO").length;
  const cancelado = orders.filter((o) => o.status === "CANCELADO").length;

  const revenue = orders
    .filter((o) => o.status !== "CANCELADO")
    .reduce((sum, o) => sum + parsePrice(o.price), 0);

  const now = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const iso   = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("es-CO", { weekday: "short" });
    const count = orders.filter((o) => new Date(o.createdAt).toISOString().startsWith(iso)).length;
    return { label, count };
  });
  const maxDay = Math.max(...last7.map((d) => d.count), 1);

  const productMap: Record<string, number> = {};
  orders
    .filter((o) => o.status !== "CANCELADO")
    .forEach((o) => { productMap[o.productName] = (productMap[o.productName] || 0) + 1; });
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  const maxTop = Math.max(...topProducts.map((p) => p.count), 1);

  return {
    totalProducts, visible, hidden, withLowStock, lowStockProducts, products,
    pendiente, pagado, enviado, cancelado, revenue, last7, maxDay,
    topProducts, maxTop, totalOrders: orders.length,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen de pedidos e inventario</p>
        </div>
        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
          <Link href="/admin/productos/nuevo">
            <Plus className="h-4 w-4" />
            Agregar articulo
          </Link>
        </Button>
      </div>

      {/* ── PEDIDOS ── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Pedidos</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pendientes", value: stats.pendiente, icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Pagados",    value: stats.pagado,    icon: CheckCircle,  color: "text-green-600",  bg: "bg-green-50"  },
            { label: "Enviados",   value: stats.enviado,   icon: Truck,        color: "text-blue-600",   bg: "bg-blue-50"   },
            { label: "Cancelados", value: stats.cancelado, icon: XCircle,      color: "text-gray-400",   bg: "bg-gray-100"  },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
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

        {/* Ingresos + gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos estimados</p>
                <p className="text-2xl font-bold text-amber-600">{formatPrice(stats.revenue)}</p>
                <p className="text-xs text-muted-foreground">{stats.totalOrders} pedidos en total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pedidos — últimos 7 días</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-end gap-2 h-20">
                {stats.last7.map(({ label, count }) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-stone-600">{count > 0 ? count : ""}</span>
                    <div className="w-full flex items-end justify-center" style={{ height: 52 }}>
                      <div
                        className="w-full rounded-t-md bg-amber-400 transition-all"
                        style={{ height: `${Math.max((count / stats.maxDay) * 52, count > 0 ? 6 : 2)}px` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top productos */}
        {stats.topProducts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Productos más pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topProducts.map(({ name, count }) => (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate pr-4">{name}</span>
                    <span className="text-muted-foreground flex-shrink-0">{count} {count === 1 ? "pedido" : "pedidos"}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(count / stats.maxTop) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── INVENTARIO ── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Inventario</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Articulos", value: stats.totalProducts, icon: Package,       color: "text-blue-600",  bg: "bg-blue-50"  },
            { title: "Visibles",        value: stats.visible,       icon: CheckCircle,   color: "text-green-600", bg: "bg-green-50" },
            { title: "Ocultos",         value: stats.hidden,        icon: EyeOff,        color: "text-gray-500",  bg: "bg-gray-100" },
            { title: "Stock Bajo",      value: stats.withLowStock,  icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          ].map(({ title, value, icon: Icon, color, bg }) => (
            <Card key={title}>
              <CardContent className="p-5">
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

        {stats.lowStockProducts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Alertas de Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.lowStockProducts.map((product) => {
                  const lowSizes = product.sizes.filter((s) => s.stock > 0 && s.stock <= LOW_STOCK_THRESHOLD);
                  return (
                    <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {lowSizes.map((s) => (
                            <Badge key={s.size} variant="warning">{s.size}: {s.stock} ud</Badge>
                          ))}
                        </div>
                      </div>
                      <Link href={`/admin/productos/${product.id}`}>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Artículos Recientes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/productos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.products.slice(0, 8).map((product) => {
                const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
                return (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0].url} alt={product.name} className="w-10 h-10 object-cover rounded-md" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatPrice(Number(product.price))}</span>
                      <Badge variant={
                        !product.isVisible ? "secondary"
                        : totalStock === 0 ? "destructive"
                        : totalStock <= LOW_STOCK_THRESHOLD ? "warning"
                        : "success"
                      }>
                        {!product.isVisible ? "Oculto"
                          : totalStock === 0 ? "Agotado"
                          : totalStock <= LOW_STOCK_THRESHOLD ? "Stock bajo"
                          : "Disponible"}
                      </Badge>
                      <Link href={`/admin/productos/${product.id}`}>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
