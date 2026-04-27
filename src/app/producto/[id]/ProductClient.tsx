"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, X, ZoomIn,
  ShoppingCart, Package, Bell, MessageCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface ProductSize {
  size: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  createdAt: string;
  category: { name: string };
  images: { url: string }[];
  sizes: ProductSize[];
}

export function ProductClient({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();

  // Gallery
  const [imgIndex, setImgIndex] = useState(0);
  const [zoomed,   setZoomed]   = useState(false);

  // Cart
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded]               = useState(false);

  // Avísame
  const [alertPhone,    setAlertPhone]    = useState("");
  const [alertSize,     setAlertSize]     = useState<string | null>(null);
  const [alertSending,  setAlertSending]  = useState(false);
  const [alertSent,     setAlertSent]     = useState(false);

  const totalStock     = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  const availableSizes = product.sizes.filter((s) => s.stock > 0);
  const hasSizes       = availableSizes.length > 0;
  const canAdd         = totalStock > 0 && (!hasSizes || selectedSize !== null);

  function prevImg() { setImgIndex((i) => (i === 0 ? product.images.length - 1 : i - 1)); }
  function nextImg() { setImgIndex((i) => (i === product.images.length - 1 ? 0 : i + 1)); }

  function handleAdd() {
    addItem({
      productId:      product.id,
      productName:    product.name,
      size:           selectedSize,
      price:          product.price,
      priceFormatted: formatPrice(product.price),
      imageUrl:       product.images[0]?.url ?? null,
    });
    setAdded(true);
    toast.success("Añadido al carrito 🛒");
  }

  async function handleAviso() {
    if (!alertPhone.trim()) return;
    setAlertSending(true);
    try {
      await fetch("/api/aviso-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId:   product.id,
          productName: product.name,
          size:        alertSize,
          phone:       alertPhone.trim(),
        }),
      });
      setAlertSent(true);
      toast.success("¡Listo! Te avisamos cuando vuelva.");
    } catch {
      toast.error("No se pudo registrar. Intenta de nuevo.");
    } finally {
      setAlertSending(false);
    }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isNew        = new Date(product.createdAt) >= sevenDaysAgo;

  return (
    <>
      {/* ── Zoom overlay ─────────────────────────────── */}
      {zoomed && product.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setZoomed(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[imgIndex].url}
            alt={product.name}
            className="max-w-full max-h-full object-contain select-none"
            style={{ touchAction: "pinch-zoom" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
            onClick={() => setZoomed(false)}
          >
            <X className="h-6 w-6" />
          </button>
          {product.images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); prevImg(); }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-16 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); nextImg(); }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Product layout ───────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="sm:flex">
          {/* Gallery */}
          <div className="sm:w-1/2">
            <div
              className="relative aspect-square bg-stone-100 cursor-zoom-in"
              onClick={() => product.images.length > 0 && setZoomed(true)}
            >
              {product.images.length > 0 ? (
                <Image
                  src={product.images[imgIndex].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-20 w-20 text-stone-300" />
                </div>
              )}

              {/* Zoom hint */}
              {product.images.length > 0 && (
                <div className="absolute bottom-3 right-3 bg-black/40 text-white rounded-full p-1.5 pointer-events-none">
                  <ZoomIn className="h-4 w-4" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                {isNew && totalStock > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow">
                    NUEVO
                  </span>
                )}
                {totalStock > 0 && totalStock <= 3 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow">
                    ÚLTIMAS
                  </span>
                )}
                {totalStock === 0 && (
                  <span className="bg-stone-600 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow">
                    AGOTADO
                  </span>
                )}
              </div>

              {/* Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImg(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImg(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === imgIndex ? "border-amber-500" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`Foto ${i + 1}`}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="p-5 sm:p-7 sm:w-1/2 space-y-5 flex flex-col">
            {/* Category + name + price */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
                {product.category.name}
              </p>
              <h1 className="text-2xl font-bold leading-tight text-gray-900">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {formatPrice(product.price)}
              </p>
            </div>

            {product.description && (
              <p className="text-sm text-stone-500 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* ── IN STOCK ── */}
            {totalStock > 0 ? (
              <>
                {/* Size selector */}
                {hasSizes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Selecciona tu talla:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s) => {
                        const avail      = s.stock > 0;
                        const isSelected = selectedSize === s.size;
                        return (
                          <button
                            key={s.size}
                            disabled={!avail}
                            onClick={() => setSelectedSize(isSelected ? null : s.size)}
                            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                              !avail
                                ? "border-gray-100 text-gray-300 bg-gray-50 line-through cursor-not-allowed"
                                : isSelected
                                ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                                : "border-gray-200 text-gray-700 bg-white hover:border-amber-400"
                            }`}
                          >
                            {s.size}
                            {avail && s.stock <= 3 && (
                              <span className={`ml-1 text-xs ${isSelected ? "text-white/80" : "text-amber-500"}`}>
                                ({s.stock})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {product.sizes.some((s) => s.stock > 0 && s.stock <= 3) && (
                      <p className="text-xs text-amber-600 mt-2">⚡ Pocas unidades disponibles</p>
                    )}
                  </div>
                )}

                {/* CTA */}
                {!added ? (
                  <button
                    disabled={!canAdd}
                    onClick={handleAdd}
                    className="w-full bg-[#1a1209] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {hasSizes && !selectedSize ? "Selecciona una talla" : "Agregar al carrito"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => { setAdded(false); openCart(); }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Ver carrito y pagar
                    </button>
                    <button
                      onClick={() => setAdded(false)}
                      className="w-full border border-stone-200 text-stone-600 font-medium py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-sm"
                    >
                      Seguir comprando
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* ── OUT OF STOCK — Avísame ── */
              <div className="space-y-4">
                <div className="bg-stone-50 rounded-xl p-4 text-center">
                  <p className="font-bold text-stone-500 text-lg">Agotado</p>
                  <p className="text-sm text-stone-400 mt-1">
                    Déjanos tu WhatsApp y te avisamos cuando vuelva
                  </p>
                </div>

                {!alertSent ? (
                  <div className="space-y-3">
                    {/* Size choice for alert */}
                    {product.sizes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-stone-500 mb-2">
                          ¿Qué talla necesitas?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((s) => (
                            <button
                              key={s.size}
                              onClick={() => setAlertSize(alertSize === s.size ? null : s.size)}
                              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                                alertSize === s.size
                                  ? "border-amber-500 bg-amber-50 text-amber-700"
                                  : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                              }`}
                            >
                              {s.size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <input
                      type="tel"
                      placeholder="Tu número de WhatsApp"
                      value={alertPhone}
                      onChange={(e) => setAlertPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                    />
                    <button
                      onClick={handleAviso}
                      disabled={alertSending || !alertPhone.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                      {alertSending ? "Registrando..." : "Avísame cuando vuelva"}
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p className="font-semibold text-emerald-700">¡Registrado!</p>
                    <p className="text-sm text-emerald-600 mt-1">
                      Te escribimos al WhatsApp cuando este producto esté disponible.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment methods */}
            <div className="flex items-center justify-center gap-3 text-xs text-stone-400 pt-2 border-t border-stone-100">
              <span>💳 Nequi</span><span>·</span>
              <span>🏦 Transferencia</span><span>·</span>
              <span>💵 Efectivo</span>
            </div>

            {/* Share / WhatsApp */}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "573150014381"}?text=${encodeURIComponent(`Hola, vi este producto en su catálogo y quiero más info: ${product.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/5 rounded-xl py-2.5 text-sm font-medium transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Preguntar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
