"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function CartButton() {
  const { count, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className="relative p-2 rounded-lg text-gold-400 hover:bg-gold-900/30 transition-colors"
      aria-label="Abrir carrito"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
          {count}
        </span>
      )}
    </button>
  );
}
