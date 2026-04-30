"use client";

import { useSearch } from "@/context/SearchContext";
import { HeroCarousel } from "./HeroCarousel";

interface Product {
  id: string;
  name: string;
  price: number;
  category: { name: string };
  images: { url: string }[];
}

export function HeroCarouselSection({ products }: { products: Product[] }) {
  const { search } = useSearch();
  if (search.trim()) return null;
  return <HeroCarousel products={products} />;
}
