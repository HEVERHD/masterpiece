"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Package, ChevronLeft, ChevronRight, X, ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  category: { name: string };
  images: { url: string }[];
  sizes: ProductSize[];
}

interface ProductModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function ProductModal({ product, open, onClose }: ProductModalProps) {
  const { addItem, openCart } = useCart();
  const [imgIndex, setImgIndex]         = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded]               = useState(false);

  if (!open) return null;

  const totalStock    = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  const availableSizes = product.sizes.filter((s) => s.stock > 0);
  const hasSizes      = availableSizes.length > 0;
  const canAdd        = totalStock > 0 && (!hasSizes || selectedSize !== null);

  function handleClose() {
    setSelectedSize(null);
    setAdded(false);
    onClose();
  }

  function handleAdd() {
    addItem({
      productId:     product.id,
      productName:   product.name,
      size:          selectedSize,
      price:         product.price,
      priceFormatted: formatPrice(product.price),
      imageUrl:      product.images[0]?.url ?? null,
    });
    setAdded(true);
    toast.success("Añadido al carrito 🛒");
  }

  function handleGoToCart() {
    handleClose();
    openCart();
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
          <Badge variant="secondary">{product.category.name}</Badge>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="sm:flex">
          {/* Galería */}
          <div className="relative sm:w-1/2">
            <div className="relative aspect-square bg-gray-100">
              {product.images.length > 0 ? (
                <Image
                  src={product.images[imgIndex].url}
                  alt={product.name}
                  fill className="object-cover"
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
                    onClick={() => setImgIndex((i) => (i === 0 ? product.images.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => (i === product.images.length - 1 ? 0 : i + 1))}
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
                    key={i} onClick={() => setImgIndex(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? "border-amber-500" : "border-transparent"}`}
                  >
                    <Image src={img.url} alt={`Foto ${i + 1}`} width={56} height={56} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5 sm:w-1/2 space-y-4">
            <div>
              <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatPrice(product.price)}</p>
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Tallas */}
            {hasSizes && totalStock > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Selecciona tu talla:</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const available  = s.stock > 0;
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
                            ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                            : "border-gray-300 text-gray-800 bg-white hover:border-amber-400"
                        }`}
                      >
                        {s.size}
                        {available && s.stock <= 3 && (
                          <span className={`ml-1 text-xs ${isSelected ? "text-white/80" : "text-amber-500"}`}>({s.stock})</span>
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
            {totalStock === 0 ? (
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <p className="font-semibold text-gray-500">Agotado</p>
                <p className="text-sm text-gray-400 mt-1">Escríbenos para saber cuándo vuelve</p>
              </div>
            ) : !added ? (
              <button
                disabled={!canAdd}
                onClick={handleAdd}
                className="w-full bg-[#1a1209] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {hasSizes && !selectedSize ? "Selecciona una talla" : "Agregar al carrito"}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleGoToCart}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Ver carrito y pagar
                </button>
                <button
                  onClick={handleClose}
                  className="w-full border border-stone-200 text-stone-600 font-medium py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-sm"
                >
                  Seguir comprando
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
              <span>💳 Nequi</span><span>·</span>
              <span>🏦 Transferencia</span><span>·</span>
              <span>💵 Efectivo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
