"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageCircle, Package, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
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
  createdAt: string | Date;
  category: { name: string };
  images: { url: string }[];
  sizes: ProductSize[];
  lowStockAt?: number;
}

const STOCK_BAR_MAX = 5;

export function ProductCard({ product }: { product: Product }) {
  const [imgIndex, setImgIndex]    = useState(0);
  const { isWishlisted, toggle }   = useWishlist();
  const { addItem, openCart }      = useCart();
  const router                     = useRouter();

  const totalStock     = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  const hasImages      = product.images.length > 0;
  const lowStockAt     = product.lowStockAt ?? 3;
  const isLowStock     = totalStock > 0 && totalStock <= lowStockAt;
  const availableSizes = product.sizes.filter((s) => s.stock > 0);
  const wishlisted     = isWishlisted(product.id);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isNew        = new Date(product.createdAt) >= sevenDaysAgo;

  const filledBlocks = Math.min(totalStock, STOCK_BAR_MAX);
  const stockBarColor =
    totalStock === 1 ? "bg-red-500" :
    totalStock === 2 ? "bg-amber-500" :
    "bg-amber-400";

  return (
    <>
      <Link
        href={`/producto/${product.id}`}
        className="group bg-white rounded-xl overflow-hidden border border-stone-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
      >
        {/* Image area */}
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

              {/* Carousel arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImgIndex((i) => (i === 0 ? product.images.length - 1 : i - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImgIndex((i) => (i === product.images.length - 1 ? 0 : i + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-700" />
                  </button>
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-1 z-10">
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

          {/* Wishlist heart */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(product.id);
            }}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 z-10"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors duration-200 ${
                wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-10">
            {isNew && totalStock > 0 && (
              <span className="bg-emerald-500 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                NUEVO
              </span>
            )}
          </div>

          {/* Agotado overlay */}
          {totalStock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="bg-white text-black text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col gap-1.5">
          <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
            {product.category.name}
          </span>

          <p className="font-semibold text-[13px] leading-snug text-gray-800 group-hover:text-gold-700 transition-colors line-clamp-2 flex-1">
            {product.name}
          </p>

          {/* Stock bar — replaces ÚLTIMAS badge */}
          {isLowStock && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-[3px]">
                {Array.from({ length: STOCK_BAR_MAX }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-1.5 rounded-sm transition-colors ${
                      i < filledBlocks ? stockBarColor : "bg-stone-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-amber-600">
                {totalStock === 1 ? "¡Última!" : `${totalStock} disp.`}
              </span>
            </div>
          )}

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

          <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-auto">
            <span className="font-bold text-sm text-gold-600 tracking-tight">
              {formatPrice(product.price)}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (availableSizes.length === 1) {
                  // Una sola talla → agregar directo al carrito
                  addItem({
                    productId:      product.id,
                    productName:    product.name,
                    size:           availableSizes[0].size,
                    price:          product.price,
                    priceFormatted: formatPrice(product.price),
                    imageUrl:       product.images[0]?.url ?? null,
                  });
                  toast.success("Añadido al carrito 🛒");
                  openCart();
                } else if (availableSizes.length === 0) {
                  // Sin tallas definidas → agregar directo
                  addItem({
                    productId:      product.id,
                    productName:    product.name,
                    size:           null,
                    price:          product.price,
                    priceFormatted: formatPrice(product.price),
                    imageUrl:       product.images[0]?.url ?? null,
                  });
                  toast.success("Añadido al carrito 🛒");
                  openCart();
                } else {
                  // Múltiples tallas → ir a la página del producto
                  router.push(`/producto/${product.id}`);
                }
              }}
              disabled={totalStock === 0}
              className="flex items-center gap-1 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Pedir
            </button>
          </div>
        </div>
      </Link>
    </>
  );
}
