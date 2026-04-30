"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  category: { name: string };
  images: { url: string }[];
}

interface HeroCarouselProps {
  products: Product[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3800, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  if (products.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl">
      {/* Viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-[0_0_100%] min-w-0 relative"
            >
              <Link href={`/producto/${product.id}`} className="block">
                {/* Imagen */}
                <div className="relative aspect-[4/5] sm:aspect-[16/7] w-full bg-stone-900">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover object-top"
                      sizes="100vw"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 bg-stone-800" />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Texto sobre la imagen */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-amber-400/90 mb-1.5">
                    {product.category.name}
                  </span>
                  <h2 className="text-white font-bold text-xl sm:text-3xl leading-tight line-clamp-2 mb-2">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold text-lg sm:text-2xl">
                      {formatPrice(product.price)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-white/20 transition-colors">
                      Ver producto →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 right-5 flex items-center gap-1.5">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === selectedIndex
                ? "bg-amber-400 w-5 h-1.5"
                : "bg-white/40 w-1.5 h-1.5 hover:bg-white/70"
            }`}
            aria-label={`Ir al slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
