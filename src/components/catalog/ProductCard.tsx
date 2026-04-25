"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle, Package, ChevronLeft, ChevronRight } from "lucide-react";
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
  const isLowStock = totalStock > 0 && totalStock <= 3;
  const availableSizes = product.sizes.filter((s) => s.stock > 0);

  function handlePedir(e: React.MouseEvent) {
    e.stopPropagation();
    setModalOpen(true);
  }

  return (
    <>
      <div
        className="group bg-white rounded-xl overflow-hidden border border-stone-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col"
        onClick={() => setModalOpen(true)}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] bg-stone-50 overflow-hidden">
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
                      setImgIndex((i) => (i === 0 ? product.images.length - 1 : i - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIndex((i) => (i === product.images.length - 1 ? 0 : i + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-700" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {product.images.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i === imgIndex ? "bg-white w-4" : "bg-white/50 w-1"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-12 w-12 text-stone-200" />
            </div>
          )}

          {/* Solo badge ÚLTIMAS sobre la imagen — limpio */}
          {isLowStock && (
            <div className="absolute top-2 left-2 pointer-events-none">
              <span className="bg-amber-500 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                ÚLTIMAS
              </span>
            </div>
          )}

          {/* Agotado overlay */}
          {totalStock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-black text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col gap-1.5">
          {/* Categoría como texto sutil */}
          <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
            {product.category.name}
          </span>

          <p className="font-semibold text-[13px] leading-snug text-gray-800 group-hover:text-gold-700 transition-colors line-clamp-2 flex-1">
            {product.name}
          </p>

          {/* Tallas disponibles */}
          {availableSizes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {availableSizes.slice(0, 5).map((s) => (
                <span
                  key={s.size}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 font-medium"
                >
                  {s.size}
                </span>
              ))}
              {availableSizes.length > 5 && (
                <span className="text-[10px] text-stone-400 self-center">
                  +{availableSizes.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Precio + CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-auto">
            <span className="font-bold text-sm text-gold-600 tracking-tight">
              {formatPrice(product.price)}
            </span>
            <button
              onClick={handlePedir}
              disabled={totalStock === 0}
              className="flex items-center gap-1 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Pedir
            </button>
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
