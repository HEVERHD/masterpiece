"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Download, CheckSquare, Square, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string | null;
}

interface Props {
  products: ProductItem[];
}

const BRAND = "MASTERPIECE";
const BRAND_SUB = "CARTAGENA";

export function ExportClient({ products }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(products.map((p) => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const selectedProducts = products.filter((p) => selected.has(p.id)).slice(0, 9);

  async function generateImage() {
    if (selectedProducts.length === 0) {
      toast.error("Selecciona al menos un producto");
      return;
    }
    setGenerating(true);

    try {
      // Canvas: 1080 × 1920 (9:16 story format)
      const W = 1080;
      const H = 1920;
      const canvas = document.createElement("canvas");
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = "#0E0B04";
      ctx.fillRect(0, 0, W, H);

      // Gold gradient header bar
      const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
      headerGrad.addColorStop(0, "#78350f");
      headerGrad.addColorStop(0.5, "#C4973A");
      headerGrad.addColorStop(1, "#78350f");
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, W, 4);

      // Brand name
      ctx.textAlign = "center";
      ctx.fillStyle = "#C4973A";
      ctx.font      = "bold 72px Arial";
      ctx.letterSpacing = "12px";
      ctx.fillText(BRAND, W / 2, 110);

      ctx.fillStyle = "#a87c3a";
      ctx.font      = "28px Arial";
      ctx.letterSpacing = "8px";
      ctx.fillText(BRAND_SUB, W / 2, 160);

      // Divider
      ctx.strokeStyle = "#C4973A44";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(80, 185);
      ctx.lineTo(W - 80, 185);
      ctx.stroke();

      // Grid layout
      const cols = selectedProducts.length <= 4 ? 2 : selectedProducts.length <= 6 ? 2 : 3;
      const rows = Math.ceil(selectedProducts.length / cols);
      const pad  = 40;
      const gap  = 20;
      const cellW = Math.floor((W - pad * 2 - gap * (cols - 1)) / cols);
      const imgH  = Math.floor(cellW * 1.2);
      const cellH = imgH + 90;
      const gridH = rows * cellH + (rows - 1) * gap;
      const startY = Math.max(220, Math.floor((H - 180 - gridH) / 2));

      for (let i = 0; i < selectedProducts.length; i++) {
        const p   = selectedProducts[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x   = pad + col * (cellW + gap);
        const y   = startY + row * (cellH + gap);

        // Card background
        ctx.fillStyle = "#1A1208";
        roundRect(ctx, x, y, cellW, cellH, 12);
        ctx.fill();

        // Product image
        if (p.image) {
          try {
            const img = await loadImage(p.image);
            // clip to rounded rect
            ctx.save();
            roundRect(ctx, x, y, cellW, imgH, 12);
            ctx.clip();
            ctx.drawImage(img, x, y, cellW, imgH);
            ctx.restore();
          } catch {
            // fallback if image fails
            ctx.fillStyle = "#2a2015";
            roundRect(ctx, x, y, cellW, imgH, 12);
            ctx.fill();
          }
        }

        // Price tag
        const priceStr = formatPrice(p.price);
        ctx.fillStyle  = "#C4973A";
        ctx.font       = "bold 26px Arial";
        ctx.textAlign  = "left";
        ctx.fillText(priceStr, x + 12, y + imgH + 34);

        // Product name
        ctx.fillStyle = "#e8e0d0";
        ctx.font      = "22px Arial";
        const maxW    = cellW - 24;
        const nameText = truncateText(ctx, p.name, maxW);
        ctx.fillText(nameText, x + 12, y + imgH + 62);
      }

      // Footer
      ctx.fillStyle = "#C4973A44";
      ctx.fillRect(0, H - 120, W, 1);

      ctx.textAlign = "center";
      ctx.fillStyle = "#C4973A";
      ctx.font      = "bold 30px Arial";
      ctx.fillText("@masterpiece_cartagena", W / 2, H - 72);

      ctx.fillStyle = "#78622a";
      ctx.font      = "22px Arial";
      ctx.fillText("Cartagena de Indias 🇨🇴", W / 2, H - 38);

      // Download
      const link = document.createElement("a");
      link.download = `catalogo-masterpiece-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Imagen descargada");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar la imagen");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-amber-500" />
          Exportar catálogo
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Selecciona hasta 9 productos y genera una imagen story para Instagram.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product selector */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-amber-600 hover:text-amber-800 font-medium"
              >
                Todos
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {products.map((p) => {
              const isSelected = selected.has(p.id);
              const isMaxed = selected.size >= 9 && !isSelected;
              return (
                <button
                  key={p.id}
                  onClick={() => !isMaxed && toggle(p.id)}
                  disabled={isMaxed}
                  className={`relative rounded-xl overflow-hidden border-2 text-left transition-all ${
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-200"
                      : isMaxed
                      ? "border-gray-200 opacity-40 cursor-not-allowed"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <div className="relative aspect-[3/4] bg-stone-100">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-stone-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-amber-500 drop-shadow" />
                      ) : (
                        <Square className="h-5 w-5 text-white/70 drop-shadow" />
                      )}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                      {p.category}
                    </p>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mt-0.5">
                      {p.name}
                    </p>
                    <p className="text-xs font-bold text-amber-600 mt-1">
                      {formatPrice(p.price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview + download */}
        <div className="space-y-4">
          {/* Story preview */}
          <div
            ref={previewRef}
            className="w-full aspect-[9/16] bg-[#0E0B04] rounded-2xl overflow-hidden relative border border-stone-700"
          >
            {/* Header */}
            <div className="h-0.5 w-full bg-gradient-to-r from-stone-800 via-amber-500 to-stone-800" />
            <div className="px-4 pt-4 pb-2 text-center">
              <p className="text-amber-500 font-black tracking-[0.2em] text-sm">
                {BRAND}
              </p>
              <p className="text-amber-700/70 tracking-[0.15em] text-[9px] mt-0.5">
                {BRAND_SUB}
              </p>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-2/3 gap-2">
                <ImageIcon className="h-10 w-10 text-stone-700" />
                <p className="text-stone-600 text-xs text-center px-4">
                  Selecciona productos para ver el preview
                </p>
              </div>
            ) : (
              <div
                className={`grid gap-1 px-2 ${
                  selectedProducts.length <= 4
                    ? "grid-cols-2"
                    : "grid-cols-3"
                }`}
              >
                {selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg overflow-hidden bg-[#1A1208]"
                  >
                    <div className="relative aspect-[3/4] bg-stone-800">
                      {p.image && (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      )}
                    </div>
                    <div className="p-1">
                      <p className="text-amber-500 font-bold text-[7px] leading-none">
                        {formatPrice(p.price)}
                      </p>
                      <p className="text-stone-300 text-[6px] leading-tight line-clamp-1 mt-0.5">
                        {p.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-0 inset-x-0 text-center pb-2 pt-1 border-t border-amber-900/30">
              <p className="text-amber-600 text-[8px] font-bold tracking-wider">
                @masterpiece_cartagena
              </p>
            </div>
          </div>

          <Button
            onClick={generateImage}
            disabled={generating || selected.size === 0}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar PNG (1080×1920)
              </>
            )}
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Formato story de Instagram · {selected.size}/9 productos
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  while (text.length > 0 && ctx.measureText(text + "…").width > maxWidth) {
    text = text.slice(0, -1);
  }
  return text + "…";
}
