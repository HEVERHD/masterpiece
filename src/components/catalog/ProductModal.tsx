"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle, Package, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function ProductModal({ product, open, onClose }: ProductModalProps) {
  const [imgIndex, setImgIndex] = useState(0);

  if (!open) return null;

  const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);

  function shareWhatsApp() {
    const url = `${window.location.origin}/?producto=${product.id}`;
    const text = `👗 *${product.name}*\n💰 Precio: ${formatPrice(product.price)}\n📍 Masterpiecectg — Cartagena\n\nVer catalogo: ${url}`;
    window.open(
      `https://wa.me/573150014381?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <Badge variant="secondary">{product.category.name}</Badge>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === imgIndex
                        ? "border-amber-500"
                        : "border-transparent"
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

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">
                  Tallas disponibles:
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <div
                      key={s.size}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                        s.stock > 0
                          ? "border-gray-300 text-gray-800 bg-white"
                          : "border-gray-100 text-gray-300 bg-gray-50 line-through"
                      }`}
                    >
                      {s.size}
                      {s.stock > 0 && s.stock <= 3 && (
                        <span className="ml-1 text-amber-500 text-xs">
                          ({s.stock})
                        </span>
                      )}
                    </div>
                  ))}
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
            ) : null}

            <Button
              variant="whatsapp"
              className="w-full font-semibold gap-2"
              onClick={shareWhatsApp}
            >
              <MessageCircle className="h-5 w-5" />
              Compartir por WhatsApp
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Masterpiecectg — Cartagena 🇨🇴
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
