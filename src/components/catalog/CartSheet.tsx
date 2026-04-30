"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X, ArrowLeft, Trash2, ShoppingCart, CheckCircle2,
  Loader2, Bike, Store, MapPin, PackageIcon, Copy, Check, Smartphone,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type View = "cart" | "delivery" | "form" | "success";
type DeliveryType = "domicilio" | "envio_nacional" | "tienda" | null;

function getMethodLogo(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes("bre-b") || t.includes("breb") || t.includes("bre b")) return "/brelogo.png";
  if (t.includes("bancolombia")) return "/bancolombia.webp";
  if (t.includes("nequi"))       return "/Nequi.webp";
  if (t.includes("daviplata"))   return "/daviplatalogo.png";
  return null;
}

const STORE_ADDRESS = "Campestre mz 82 lote 3 etapa 8, Cartagena, Colombia";
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const MAPS_EMBED = `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${encodeURIComponent(STORE_ADDRESS)}&zoom=16`;
const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "573150014381";

export function CartSheet() {
  const { items, removeItem, clearCart, isOpen, closeCart, total, count } = useCart();

  const [view, setView]                 = useState<View>("cart");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress]           = useState("");
  const [city, setCity]                 = useState("");
  const [carrier, setCarrier]           = useState<"interrapidisimo" | "envia" | "">("");
  const [message, setMessage]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [orderId,  setOrderId]          = useState<string | null>(null);
  const [copied,   setCopied]           = useState<string | null>(null);
  const [methods,  setMethods]          = useState<{ id: string; title: string; subtitle: string | null; value: string | null; appLink: string | null }[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1800);
  }

  // Fetch payment methods when success view is shown
  useEffect(() => {
    if (view === "success" && methods.length === 0) {
      setLoadingMethods(true);
      fetch("/api/metodos-pago")
        .then((r) => r.json())
        .then(setMethods)
        .catch(() => {})
        .finally(() => setLoadingMethods(false));
    }
  }, [view, methods.length]);

  // Reset view when sheet closes
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setView("cart");
        setDeliveryType(null);
        setError(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  function handleBack() {
    if (view === "form")     setView("delivery");
    if (view === "delivery") setView("cart");
  }

  const formValid =
    customerName.trim() &&
    customerPhone.trim() &&
    (deliveryType === "tienda" || address.trim()) &&
    (deliveryType !== "envio_nacional" || (city.trim() && carrier));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || items.length === 0) return;
    setLoading(true);
    setError(null);

    const isSingle = items.length === 1;
    const payload = {
      productId:     isSingle ? items[0].productId   : null,
      productName:   isSingle ? items[0].productName  : `${items.length} artículos`,
      size:          isSingle ? items[0].size          : null,
      price:         formatPrice(total),
      items:         isSingle ? null : items.map((i) => ({
        productId:    i.productId,
        productName:  i.productName,
        size:         i.size,
        price:        i.priceFormatted,
      })),
      customerName:  customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType,
      address:       deliveryType === "tienda" ? STORE_ADDRESS : address.trim(),
      city:          city.trim(),
      carrier,
      message:       message.trim(),
    };

    try {
      const res  = await fetch("/api/pedido", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setOrderId(data.orderId ?? null);
      clearCart();
      setView("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos procesar tu pedido.");
    } finally {
      setLoading(false);
    }
  }

  const deliveryLabel: Record<string, string> = {
    domicilio:      "🛵 Domicilio en Cartagena",
    envio_nacional: "📦 Envío nacional",
    tienda:         "🏪 Recoger en tienda",
  };

  const waText = encodeURIComponent(
    `Hola Masterpiece! 👋 Adjunto mi comprobante de pago.\n\n` +
    items.map((i) => `• ${i.productName}${i.size ? ` — ${i.size}` : ""} — ${i.priceFormatted}`).join("\n") +
    (orderId ? `\n\nID: ${orderId}` : "")
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={closeCart}
      />

      {/* Sheet */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {(view === "delivery" || view === "form") && (
              <button onClick={handleBack} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="font-bold text-base">
              {view === "cart"     && `Carrito (${count})`}
              {view === "delivery" && "¿Cómo quieres recibirlo?"}
              {view === "form"     && "Tus datos"}
              {view === "success"  && "¡Pedido confirmado!"}
            </h2>
          </div>
          <button onClick={closeCart} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── VIEW: CART ── */}
        {view === "cart" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-stone-400">
                <ShoppingCart className="h-12 w-12 opacity-30" />
                <p className="text-sm">Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex gap-3 bg-stone-50 rounded-xl p-3">
                      {item.imageUrl ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-stone-200 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate">{item.productName}</p>
                        {item.size && <p className="text-xs text-stone-500 mt-0.5">Talla: {item.size}</p>}
                        <p className="text-amber-600 font-bold text-sm mt-1">{item.priceFormatted}</p>
                      </div>
                      <button
                        onClick={() => {
                          removeItem(item.productId, item.size);
                          toast.info("Artículo eliminado");
                        }}
                        className="p-1.5 text-stone-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t p-4 space-y-3 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 text-sm">Total estimado</span>
                    <span className="text-xl font-bold text-amber-600">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-stone-400 text-center">
                    💳 Nequi · 🏦 Transferencia · 💵 Efectivo
                  </p>
                  <button
                    onClick={() => setView("delivery")}
                    className="w-full bg-[#1a1209] hover:bg-black text-amber-400 font-semibold py-3 rounded-xl transition-colors"
                  >
                    Proceder al pago →
                  </button>
                  <button
                    onClick={() => { clearCart(); toast.info("Carrito vaciado"); }}
                    className="w-full text-xs text-stone-400 hover:text-red-400 transition-colors"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── VIEW: DELIVERY ── */}
        {view === "delivery" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Mini resumen */}
            <div className="bg-stone-50 rounded-xl p-3 text-sm">
              <span className="text-stone-500">{count} artículo{count !== 1 ? "s" : ""} · </span>
              <span className="font-bold text-amber-600">{formatPrice(total)}</span>
            </div>

            <div className="space-y-3">
              {(["domicilio", "envio_nacional", "tienda"] as const).map((type) => {
                const icons = { domicilio: Bike, envio_nacional: PackageIcon, tienda: Store };
                const labels = {
                  domicilio:      { title: "Domicilio en Cartagena", sub: "Te lo llevamos a tu puerta" },
                  envio_nacional: { title: "Envío nacional",          sub: "Interrapidísimo · Envía — toda Colombia" },
                  tienda:         { title: "Recoger en tienda",       sub: "Sin costo de envío" },
                };
                const Icon = icons[type];
                const active = deliveryType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setDeliveryType(type)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${active ? "border-[#1a1209] bg-[#1a1209] text-amber-400" : "border-stone-200 hover:border-stone-300"}`}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{labels[type].title}</p>
                      <p className={`text-xs mt-0.5 ${active ? "text-amber-600" : "text-stone-400"}`}>{labels[type].sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {deliveryType === "tienda" && (
              <div className="rounded-xl overflow-hidden border border-stone-200">
                <iframe src={MAPS_EMBED} width="100%" height="160" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <div className="flex items-start gap-2 p-3 bg-stone-50">
                  <MapPin className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-stone-600">{STORE_ADDRESS}</p>
                </div>
              </div>
            )}

            <button
              disabled={!deliveryType}
              onClick={() => setView("form")}
              className="w-full bg-[#1a1209] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 font-semibold py-3 rounded-xl transition-colors"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ── VIEW: FORM ── */}
        {view === "form" && (
          <div className="flex-1 overflow-y-auto p-5">
            {/* Mini resumen */}
            <div className="bg-stone-50 rounded-xl p-3 text-sm mb-5 flex justify-between">
              <span className="text-stone-500">{deliveryLabel[deliveryType!]} · {count} artículo{count !== 1 ? "s" : ""}</span>
              <span className="font-bold text-amber-600">{formatPrice(total)}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label>
                <input
                  type="text" required placeholder="Ej: Juan Pérez"
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">WhatsApp *</label>
                <input
                  type="tel" required placeholder="3001234567"
                  value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {deliveryType === "envio_nacional" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad de destino *</label>
                    <input
                      type="text" required placeholder="Bogotá, Medellín..."
                      value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Transportadora *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["interrapidisimo", "envia"] as const).map((c) => (
                        <button key={c} type="button" onClick={() => setCarrier(c)}
                          className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${carrier === c ? "border-[#1a1209] bg-[#1a1209] text-amber-400" : "border-stone-200 hover:border-stone-300 text-gray-700"}`}
                        >
                          {c === "interrapidisimo" ? "Interrapidísimo" : "Envía"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(deliveryType === "domicilio" || deliveryType === "envio_nacional") && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {deliveryType === "domicilio" ? "Dirección en Cartagena *" : "Dirección de entrega *"}
                  </label>
                  <input
                    type="text" required placeholder="Barrio, calle, número..."
                    value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  ¿Alguna pregunta? <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2} placeholder="¿Cuánto vale el domicilio? ¿Hay otro color?"
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <button
                type="submit" disabled={loading || !formValid}
                className="w-full bg-[#1a1209] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-amber-400 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : "Confirmar pedido"}
              </button>
            </form>
          </div>
        )}

        {/* ── VIEW: SUCCESS ── */}
        {view === "success" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="text-center">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold">¡Pedido recibido!</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Realiza el pago para confirmar tu pedido.
              </p>
            </div>

            {/* Payment methods */}
            <div className="bg-stone-50 rounded-2xl p-4 space-y-3 text-sm">
              <p className="font-bold text-gray-800 text-center">💳 Métodos de pago</p>

              {loadingMethods ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-stone-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : methods.length === 0 ? (
                <p className="text-center text-stone-400 text-xs py-2">
                  Sin métodos configurados aún.
                </p>
              ) : (
                <div className="space-y-0 divide-y divide-stone-100">
                  {methods.map((m) => {
                    const logo = getMethodLogo(m.title);
                    return (
                    <div key={m.id} className="py-2.5">
                      {m.value ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {logo && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} alt="" aria-hidden className="h-6 w-auto max-w-[52px] object-contain" />
                              )}
                              <p className="font-semibold text-gray-700 text-sm">{m.title}</p>
                            </div>
                            {m.appLink && (
                              <a
                                href={m.appLink}
                                className="flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors flex-shrink-0"
                              >
                                <Smartphone className="h-3 w-3" />
                                Abrir app
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => copyText(m.value!)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors active:scale-[0.98] ${
                              copied === m.value
                                ? "bg-green-50 border-green-200"
                                : "bg-white border-stone-200 hover:bg-amber-50 hover:border-amber-200"
                            }`}
                          >
                            <div className="min-w-0 text-left">
                              {m.subtitle && (
                                <p className="text-[10px] text-stone-400 leading-none mb-1 truncate">
                                  {m.subtitle}
                                </p>
                              )}
                              <p className="font-mono font-bold text-gray-800 tracking-wider text-lg">
                                {m.value}
                              </p>
                            </div>
                            <div className={`flex items-center gap-1.5 ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
                              copied === m.value
                                ? "bg-green-100 text-green-600"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {copied === m.value
                                ? <><Check className="h-3.5 w-3.5" /> Copiado</>
                                : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {logo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={logo} alt="" aria-hidden className="h-6 w-auto max-w-[52px] object-contain" />
                            )}
                            <div>
                              <p className="font-semibold text-gray-700 text-sm">{m.title}</p>
                              {m.subtitle && (
                                <p className="text-xs text-stone-400">{m.subtitle}</p>
                              )}
                            </div>
                          </div>
                          {m.appLink && (
                            <a
                              href={m.appLink}
                              className="flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors"
                            >
                              <Smartphone className="h-3 w-3" />
                              Abrir app
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ); })}
                </div>
              )}
            </div>

            {/* Comprobante CTA */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-800 text-center">
                📤 Envía tu comprobante de pago
              </p>
              <p className="text-xs text-stone-500 text-center leading-relaxed">
                Una vez hayas pagado, envíanos el comprobante por WhatsApp al número administrativo:
              </p>
              <div className="flex items-center justify-center gap-2 bg-white border border-stone-200 rounded-xl px-4 py-2.5">
                <span className="font-mono font-bold text-gray-800 tracking-wide text-base">
                  +57 315 001 4381
                </span>
                <button
                  onClick={() => copyText("+573150014381")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    copied === "+573150014381"
                      ? "bg-green-100 text-green-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {copied === "+573150014381"
                    ? <><Check className="h-3 w-3" /> Copiado</>
                    : <><Copy className="h-3 w-3" /> Copiar</>}
                </button>
              </div>
              <a
                href={`https://wa.me/${ADMIN_WA}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <svg className="w-4 h-4 fill-white flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.859L.057 23.75a.5.5 0 0 0 .614.612l5.975-1.56A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.946 9.946 0 0 1-5.127-1.416l-.367-.217-3.793.993 1.01-3.688-.239-.381A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Abrir WhatsApp y enviar comprobante
              </a>
            </div>

            {/* Aviso confirmación */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 text-center leading-relaxed">
              ✅ Cuando Rubén confirme tu pago, te llegará un mensaje de WhatsApp con la confirmación de tu pedido.
            </div>

            {orderId && (
              <a
                href={`/pedido/${orderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-600 hover:underline text-center"
              >
                🔗 Ver estado de tu pedido
              </a>
            )}

            <button
              onClick={closeCart}
              className="text-sm text-stone-400 hover:text-stone-600 transition-colors text-center"
            >
              Seguir viendo el catálogo →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
