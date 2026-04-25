"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface ProductSize {
  size: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: { name: string };
  images: { url: string }[];
  sizes: ProductSize[];
}

interface ProductModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

type Step = "product" | "form" | "success";

export function ProductModal({ product, open, onClose }: ProductModalProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("product");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  const availableSizes = product.sizes.filter((s) => s.stock > 0);
  const hasSizes = availableSizes.length > 0;
  const canProceed = totalStock > 0 && (!hasSizes || selectedSize !== null);

  function handleClose() {
    setStep("product");
    setSelectedSize(null);
    setCustomerName("");
    setCustomerPhone("");
    setMessage("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          size: selectedSize,
          price: formatPrice(product.price),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) throw new Error("Error al enviar");
      setStep("success");
    } catch {
      setError("No pudimos enviar tu pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {step === "form" && (
              <button
                onClick={() => setStep("product")}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Badge variant="secondary">{product.category.name}</Badge>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── STEP: PRODUCT ── */}
        {step === "product" && (
          <div className="sm:flex">
            {/* Image gallery */}
            <div className="relative sm:w-1/2">
              <div className="relative aspect-square bg-gray-100">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[imgIndex].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setImgIndex((i) =>
                          i === 0 ? product.images.length - 1 : i - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setImgIndex((i) =>
                          i === product.images.length - 1 ? 0 : i + 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        i === imgIndex ? "border-gold-500" : "border-transparent"
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

            {/* Details */}
            <div className="p-5 sm:w-1/2 space-y-4">
              <div>
                <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
                <p className="text-2xl font-bold text-gold-600 mt-1">
                  {formatPrice(product.price)}
                </p>
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Size selector */}
              {hasSizes && totalStock > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Selecciona tu talla:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => {
                      const available = s.stock > 0;
                      const isSelected = selectedSize === s.size;
                      return (
                        <button
                          key={s.size}
                          disabled={!available}
                          onClick={() => setSelectedSize(isSelected ? null : s.size)}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                            !available
                              ? "border-gray-100 text-gray-300 bg-gray-50 line-through cursor-not-allowed"
                              : isSelected
                              ? "border-gold-500 bg-gold-500 text-white shadow-sm"
                              : "border-gray-300 text-gray-800 bg-white hover:border-gold-400"
                          }`}
                        >
                          {s.size}
                          {available && s.stock <= 3 && (
                            <span className={`ml-1 text-xs ${isSelected ? "text-white/80" : "text-amber-500"}`}>
                              ({s.stock})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {product.sizes.some((s) => s.stock > 0 && s.stock <= 3) && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚡ Pocas unidades disponibles
                    </p>
                  )}
                </div>
              )}

              {totalStock === 0 ? (
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <p className="font-semibold text-gray-500">Agotado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Escríbenos para saber cuándo vuelve
                  </p>
                </div>
              ) : (
                <button
                  disabled={!canProceed}
                  onClick={() => setStep("form")}
                  className="w-full bg-brand-darker hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-gold-400 font-semibold py-3 rounded-xl transition-colors"
                >
                  {hasSizes && !selectedSize
                    ? "Selecciona una talla"
                    : "Quiero este producto →"}
                </button>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Masterpiecectg — Cartagena 🇨🇴
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: FORM ── */}
        {step === "form" && (
          <div className="p-6 max-w-md mx-auto">
            {/* Order summary */}
            <div className="bg-stone-50 rounded-xl p-4 mb-6 flex items-center gap-3">
              {product.images[0] && (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{product.name}</p>
                {selectedSize && (
                  <p className="text-xs text-stone-500">Talla: {selectedSize}</p>
                )}
                <p className="text-gold-600 font-bold text-sm">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>

            <h3 className="text-base font-bold mb-1">¿Cómo te contactamos?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Te escribimos por WhatsApp para confirmar tu pedido.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Tu nombre *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Tu WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+57 300 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  ¿Alguna pregunta? <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: ¿Tienen en otro color? ¿Hacen envíos?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !customerName.trim() || !customerPhone.trim()}
                className="w-full bg-brand-darker hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-gold-400 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Confirmar pedido"
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === "success" && (
          <div className="p-10 text-center max-w-sm mx-auto">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">¡Pedido enviado!</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Recibimos tu solicitud. Te escribiremos por WhatsApp a{" "}
              <span className="font-semibold text-gray-700">{customerPhone}</span>{" "}
              para confirmar tu pedido.
            </p>
            <button
              onClick={handleClose}
              className="bg-brand-darker text-gold-400 font-semibold px-6 py-2.5 rounded-xl hover:bg-black transition-colors text-sm"
            >
              Seguir viendo el catálogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
