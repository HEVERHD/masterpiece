"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, CheckCircle2, XCircle, Truck, Clock } from "lucide-react";

type OrderStatus = "PENDIENTE" | "PAGADO" | "ENVIADO" | "CANCELADO";

interface Order {
  id: string;
  productName: string;
  size: string | null;
  price: string;
  customerName: string;
  customerPhone: string;
  deliveryType: string;
  address: string | null;
  city: string | null;
  carrier: string | null;
  message: string | null;
  status: OrderStatus;
  createdAt: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  CANCELADO: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  PAGADO: "bg-green-100 text-green-800",
  ENVIADO: "bg-blue-100 text-blue-800",
  CANCELADO: "bg-gray-100 text-gray-500",
};

const TABS: { key: OrderStatus | "TODOS"; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "PENDIENTE", label: "Pendientes" },
  { key: "PAGADO", label: "Pagados" },
  { key: "ENVIADO", label: "Enviados" },
  { key: "CANCELADO", label: "Cancelados" },
];

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderStatus | "TODOS">("PENDIENTE");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/pedidos");
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdating(id);
    try {
      const res = await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar");
      }
      toast.success(`Pedido marcado como ${STATUS_LABELS[status]}`);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = tab === "TODOS" ? orders : orders.filter((o) => o.status === tab);

  const deliveryLabel = (o: Order) => {
    if (o.deliveryType === "domicilio") return `🛵 Domicilio — ${o.address}`;
    if (o.deliveryType === "envio_nacional")
      return `📦 ${o.carrier === "interrapidisimo" ? "Interrapidísimo" : "Envía"} — ${o.city}, ${o.address}`;
    return `🏪 Recoge en tienda`;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Confirma el pago para descontar el stock
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => {
          const count =
            t.key === "TODOS"
              ? orders.length
              : orders.filter((o) => o.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="mx-auto h-10 w-10 mb-3 opacity-30" />
          No hay pedidos aquí
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-base">{order.productName}</p>
                    {order.size && (
                      <p className="text-sm text-muted-foreground">Talla: {order.size}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="font-bold text-amber-600">{order.price}</span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="text-sm space-y-0.5">
                  <p>
                    <span className="text-muted-foreground">Cliente:</span>{" "}
                    <a
                      href={`https://wa.me/${order.customerPhone.replace("+", "")}`}
                      target="_blank"
                      className="font-medium text-green-600 hover:underline"
                    >
                      {order.customerName} ({order.customerPhone})
                    </a>
                  </p>
                  <p className="text-muted-foreground">{deliveryLabel(order)}</p>
                  {order.message && (
                    <p className="italic text-muted-foreground">💬 &ldquo;{order.message}&rdquo;</p>
                  )}
                </div>

                {/* Fecha */}
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {new Date(order.createdAt).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>

                {/* Acciones */}
                {order.status === "PENDIENTE" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      disabled={updating === order.id}
                      onClick={() => updateStatus(order.id, "PAGADO")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Confirmar pago
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50 flex-1"
                      disabled={updating === order.id}
                      onClick={() => updateStatus(order.id, "CANCELADO")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
                {order.status === "PAGADO" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                      disabled={updating === order.id}
                      onClick={() => updateStatus(order.id, "ENVIADO")}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Marcar como enviado
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      disabled={updating === order.id}
                      onClick={() => updateStatus(order.id, "CANCELADO")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
