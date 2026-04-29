"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  storeUrl: string;
}

const SIZES = [
  { label: "Pequeño",  value: 400,  desc: "Tarjeta de presentación" },
  { label: "Mediano",  value: 800,  desc: "Volante / flyer"         },
  { label: "Grande",   value: 1200, desc: "Cartel / pendón"         },
];

export function QRPageClient({ storeUrl }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const printRef   = useRef<HTMLDivElement>(null);
  const [size, setSize]       = useState(800);
  const [copied, setCopied]   = useState(false);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    generateQR();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  async function generateQR() {
    if (!canvasRef.current) return;
    setReady(false);
    await QRCode.toCanvas(canvasRef.current, storeUrl, {
      width:  size,
      margin: 3,
      color: { dark: "#0E0B04", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
    setReady(true);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-masterpiece-${size}px.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR descargado");
  }

  function print() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank")!;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Masterpiece CTG</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #fff;
              font-family: Arial, sans-serif;
              padding: 40px;
            }
            .brand {
              font-size: 28px;
              font-weight: 900;
              letter-spacing: 6px;
              color: #C4973A;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .sub {
              font-size: 13px;
              letter-spacing: 4px;
              color: #a87c3a;
              margin-bottom: 24px;
              text-transform: uppercase;
            }
            img {
              width: 320px;
              height: 320px;
              border: 3px solid #C4973A;
              border-radius: 12px;
              padding: 8px;
            }
            .url {
              margin-top: 20px;
              font-size: 15px;
              color: #555;
              letter-spacing: 1px;
            }
            .cta {
              margin-top: 10px;
              font-size: 13px;
              color: #aaa;
            }
            @media print {
              body { padding: 20px; }
              img  { width: 260px; height: 260px; }
            }
          </style>
        </head>
        <body>
          <p class="brand">Masterpiece</p>
          <p class="sub">Cartagena</p>
          <img src="${dataUrl}" alt="QR Code" />
          <p class="url">${storeUrl}</p>
          <p class="cta">Escanea para ver el catálogo</p>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("URL copiada");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="h-6 w-6 text-amber-500" />
          Código QR de la tienda
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Imprime o descarga el QR para que los clientes accedan al catálogo.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-stone-200 flex flex-col items-center gap-3">
            {/* Brand header */}
            <div className="text-center">
              <p className="font-black tracking-[0.2em] text-[#C4973A] text-lg uppercase">
                Masterpiece
              </p>
              <p className="text-[#a87c3a] tracking-[0.15em] text-[10px] uppercase">
                Cartagena
              </p>
            </div>

            {/* Canvas QR */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="rounded-xl border-2 border-[#C4973A]/40"
                style={{ width: 220, height: 220 }}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* URL */}
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-600 transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {storeUrl}
            </button>
            <p className="text-[11px] text-stone-400">
              Escanea para ver el catálogo
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {/* Size selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Tamaño de descarga
            </p>
            <div className="space-y-2">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    size === s.value
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-400">{s.desc}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {s.value}px
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={download}
              disabled={!ready}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              <Download className="h-4 w-4" />
              Descargar PNG
            </Button>
            <Button
              onClick={print}
              disabled={!ready}
              variant="outline"
              className="w-full font-semibold"
            >
              <Printer className="h-4 w-4" />
              Imprimir QR
            </Button>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 text-xs text-stone-500 space-y-1">
            <p className="font-semibold text-stone-600">Consejos de impresión</p>
            <p>· Tarjeta o sticker: usa <strong>400px</strong></p>
            <p>· Flyer / volante: usa <strong>800px</strong></p>
            <p>· Cartel grande: usa <strong>1200px</strong></p>
            <p>· Siempre imprime en fondo blanco para que funcione bien.</p>
          </div>
        </div>
      </div>
      <div ref={printRef} />
    </div>
  );
}
