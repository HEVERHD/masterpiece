"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  productId: string;
  productName: string;
  size: string | null;
  price: number;
  priceFormatted: string;
  imageUrl: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string | null) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  count: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "masterpiece-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some(
        (i) => i.productId === item.productId && i.size === item.size
      );
      return exists ? prev : [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string, size: string | null) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size))
    );
  }, []);

  const clearCart  = useCallback(() => setItems([]), []);
  const openCart   = useCallback(() => setIsOpen(true), []);
  const closeCart  = useCallback(() => setIsOpen(false), []);

  const count = items.length;
  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, isOpen, openCart, closeCart, count, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
