"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ProductModal } from "./ProductModal";

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

export function ProductCard({ product }: { product: Product }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  const hasImages = product.images.length > 0;

  function shareWhatsApp(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/?producto=${product.id}`;
    const text = `👗 *${product.name}*\n💰 Precio: ${formatPrice(product.price)}\n\nVer en Masterpiecectg: ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  return (
    <>
      <div
        className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
        onClick={() => setModalOpen(true)}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {hasImages ? (
            <>
              <Image
                src={product.images[imgIndex].url}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIndex((i) =>
                        i === 0 ? product.images.length - 1 : i - 1
                      );
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIndex((i) =>
                        i === product.images.length - 1 ? 0 : i + 1
                      );
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {product.images.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === imgIndex ? "bg-white w-3" : "bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs bg-white/90 text-gray-700">
              {product.category.name}
            </Badge>
          </div>

          {/* Out of stock overlay */}
          {totalStock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col">
          <p className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
            {product.name}
          </p>

          {/* Available sizes */}
          <div className="flex flex-wrap gap-1 mt-2">
            {product.sizes.slice(0, 5).map((s) => (
              <span
                key={s.size}
                className={`text-xs px-1.5 py-0.5 rounded border ${
                  s.stock > 0
                    ? "border-gray-200 text-gray-600"
                    : "border-gray-100 text-gray-300 line-through"
                }`}
              >
                {s.size}
              </span>
            ))}
            {product.sizes.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{product.sizes.length - 5}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold-100">
            <span className="font-bold text-base text-gold-700">
              {formatPrice(product.price)}
            </span>
            <Button
              variant="whatsapp"
              size="sm"
              className="h-8 px-3 text-xs gap-1"
              onClick={shareWhatsApp}
              disabled={totalStock === 0}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Compartir
            </Button>
          </div>
        </div>
      </div>

      <ProductModal
        product={product}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
