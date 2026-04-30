"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ShoppingCart, Package } from "lucide-react";
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
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded]               = useState(false);

  if (!open) return null;

  const totalStock     = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  const availableSizes = product.sizes.filter((s) => s.stock > 0);
  const hasSizes       = availableSizes.length > 0;
  const canAdd         = totalStock > 0 && (!hasSizes || selectedSize !== null);

  function handleClose() {
    setSelectedSize(null);
    setAdded(false);
    onClose();
  }

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

  function handleGoToCart() {
    handleClose();
    openCart();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px]"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle — solo en móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="sm:flex">

          {/* Imagen — solo en desktop */}
          {product.images[0] && (
            <div className="hidden sm:block sm:w-72 flex-shrink-0 relative">
              <div className="relative aspect-[3/4] bg-stone-100">
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="288px"
                />
              </div>
            </div>
          )}

          {/* Contenido */}
          <div className="flex-1 flex flex-col">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-stone-100">
              {/* Thumbnail móvil */}
              <div className="flex items-center gap-3 sm:gap-0 flex-1 min-w-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 sm:hidden">
                  {product.images[0] ? (
                    <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-5 w-5 text-stone-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">
                    {product.category.name}
                  </p>
                  <p className="font-bold text-sm sm:text-base leading-snug line-clamp-2 text-gray-900">
                    {product.name}
                  </p>
                  <p className="text-amber-600 font-bold text-lg mt-0.5">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 mt-0.5"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pt-4 pb-6 space-y-4 flex-1">

              {product.description && (
                <p className="text-sm text-stone-500 leading-relaxed hidden sm:block">
                  {product.description}
                </p>
              )}

              {/* Tallas */}
              {hasSizes && totalStock > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Selecciona tu talla:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => {
                      const available  = s.stock > 0;
                      const isSelected = selectedSize === s.size;
                      return (
                        <button
                          key={s.size}
                          disabled={!available}
                          onClick={() => setSelectedSize(isSelected ? null : s.size)}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                            !available
                              ? "border-gray-100 text-gray-300 bg-gray-50 line-through cursor-not-allowed"
                              : isSelected
                              ? "border-[#1a1209] bg-[#1a1209] text-amber-400 shadow-sm"
                              : "border-stone-200 text-gray-700 bg-white hover:border-stone-400"
                          }`}
                        >
                          {s.size}
                          {available && s.stock <= 3 && (
                            <span className={`ml-1 text-xs ${isSelected ? "text-amber-400/70" : "text-amber-500"}`}>
                              ({s.stock})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {product.sizes.some((s) => s.stock > 0 && s.stock <= 3) && (
                    <p className="text-xs text-amber-600 mt-2.5">
                      ⚡ Pocas unidades disponibles
                    </p>
                  )}
                </div>
              )}

              {/* CTA */}
              {totalStock === 0 ? (
                <div className="bg-stone-50 rounded-xl p-4 text-center">
                  <p className="font-semibold text-gray-500 text-sm">Agotado</p>
                  <p className="text-xs text-stone-400 mt-1">Escríbenos para saber cuándo vuelve</p>
                </div>
              ) : !added ? (
                <button
                  disabled={!canAdd}
                  onClick={handleAdd}
                  className="w-full bg-[#1a1209] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {hasSizes && !selectedSize ? "Selecciona una talla" : "Agregar al carrito"}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleGoToCart}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Ver carrito y pagar
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full border border-stone-200 text-stone-500 font-medium py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-sm"
                  >
                    Seguir comprando
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
