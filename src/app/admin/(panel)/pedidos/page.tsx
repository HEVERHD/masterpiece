"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingBag, CheckCircle2, XCircle, Truck, Clock,
  Search, Download, StickyNote, ChevronLeft, ChevronRight,
  Pencil, Check,
} from "lucide-react";

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
  adminNote: string | null;
  items: unknown;
  status: OrderStatus;
  createdAt: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE:  "Pendiente",
  PAGADO:     "Pagado",
  ENVIADO:    "Enviado",
  CANCELADO:  "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDIENTE:  "bg-yellow-100 text-yellow-800",
  PAGADO:     "bg-green-100 text-green-800",
  ENVIADO:    "bg-blue-100 text-blue-800",
  CANCELADO:  "bg-gray-100 text-gray-500",
};

const TABS: { key: OrderStatus | "TODOS"; label: string }[] = [
  { key: "TODOS",     label: "Todos"      },
  { key: "PENDIENTE", label: "Pendientes" },
  { key: "PAGADO",    label: "Pagados"    },
  { key: "ENVIADO",   label: "Enviados"   },
  { key: "CANCELADO", label: "Cancelados" },
];

const PAGE_SIZE = 15;

// ── CSV export helper ─────────────────────────────────────────
function exportCSV(orders: Order[]) {
  const escape = (v: string | null | undefined) => {
    const s = v ?? "";
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const headers = [
    "ID", "Producto", "Talla", "Precio", "Cliente", "Teléfono",
    "Entrega", "Dirección", "Ciudad", "Transportista",
    "Mensaje cliente", "Nota interna", "Estado", "Fecha",
  ];
  const rows = orders.map((o) => [
    o.id,
    o.productName,
    o.size ?? "",
    o.price,
    o.customerName,
    o.customerPhone,
    o.deliveryType,
    o.address ?? "",
    o.city ?? "",
    o.carrier ?? "",
    o.message ?? "",
    o.adminNote ?? "",
    STATUS_LABELS[o.status],
    new Date(o.createdAt).toLocaleString("es-CO"),
  ].map(escape).join(","));

  const csv  = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  const now  = new Date().toISOString().slice(0, 10);
  a.href     = url;
  a.download = `pedidos-masterpiece-${now}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main page ─────────────────────────────────────────────────
export default function PedidosPage() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<OrderStatus | "TODOS">("PENDIENTE");
  const [search,   setSearch]   = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [page,     setPage]     = useState(1);

  // Note editing state: { id, draft }
  const [editNote, setEditNote] = useState<{ id: string; draft: string } | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch("/api/pedidos");
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset page when tab or search changes
  useEffect(() => { setPage(1); }, [tab, search]);

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdating(id);
    try {
      const res = await fetch("/api/pedidos", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, status }),
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

  async function saveNote(id: string, note: string) {
    setSavingNote(true);
    try {
      await fetch("/api/pedidos", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, note }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, adminNote: note } : o))
      );
      setEditNote(null);
      toast.success("Nota guardada");
    } catch {
      toast.error("Error al guardar nota");
    } finally {
      setSavingNote(false);
    }
  }

  // Search: by name or phone
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }, [orders, search]);

  // Tab filter
  const filtered = useMemo(
    () => (tab === "TODOS" ? searched : searched.filter((o) => o.status === tab)),
    [searched, tab]
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const deliveryLabel = (o: Order) => {
    if (o.deliveryType === "domicilio")
      return `🛵 Domicilio — ${o.address}`;
    if (o.deliveryType === "envio_nacional")
      return `📦 ${o.carrier === "interrapidisimo" ? "Interrapidísimo" : "Envía"} — ${o.city}, ${o.address}`;
    return `🏪 Recoge en tienda`;
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => exportCSV(tab === "TODOS" ? orders : filtered)}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 w-full rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-3"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => {
          const count =
            t.key === "TODOS"
              ? searched.length
              : searched.filter((o) => o.status === t.key).length;
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
              {count > 0 && <span className="ml-1.5 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando...</div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="mx-auto h-10 w-10 mb-3 opacity-30" />
          {search ? "Sin resultados para esa búsqueda" : "No hay pedidos aquí"}
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((order) => (
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
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
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
                    <p className="italic text-muted-foreground">
                      💬 &ldquo;{order.message}&rdquo;
                    </p>
                  )}
                </div>

                {/* Internal note */}
                <div className="border-t pt-2">
                  {editNote?.id === order.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full text-sm border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
                        rows={2}
                        placeholder="Nota interna (solo la ve Ruben)..."
                        value={editNote.draft}
                        onChange={(e) =>
                          setEditNote({ ...editNote, draft: e.target.value })
                        }
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white gap-1"
                          disabled={savingNote}
                          onClick={() => saveNote(order.id, editNote.draft)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditNote(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex items-start gap-2 w-full text-left group"
                      onClick={() =>
                        setEditNote({ id: order.id, draft: order.adminNote ?? "" })
                      }
                    >
                      <StickyNote className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                      {order.adminNote ? (
                        <span className="text-xs text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 flex-1">
                          {order.adminNote}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground group-hover:text-amber-500 transition-colors flex items-center gap-1">
                          <Pencil className="h-3 w-3" />
                          Añadir nota interna
                        </span>
                      )}
                    </button>
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
                      {order.deliveryType === "recoger_tienda" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Listo para recoger
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-1" />
                          Marcar como enviado
                        </>
                      )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} &mdash; {filtered.length} pedidos
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
