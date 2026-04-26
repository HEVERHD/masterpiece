import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, Package } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STEPS = [
  { key: "PENDIENTE", label: "Pedido recibido", desc: "Estamos esperando tu comprobante de pago" },
  { key: "PAGADO",    label: "Pago confirmado",  desc: "El pago fue verificado" },
  { key: "ENVIADO",   label: "En camino",         desc: "Tu pedido está en camino" },
] as const;

const DELIVERY_LABELS: Record<string, string> = {
  domicilio:      "🛵 Domicilio en Cartagena",
  envio_nacional: "📦 Envío nacional",
  tienda:         "🏪 Recoge en tienda",
};

function stepIndex(status: string) {
  if (status === "ENVIADO")  return 2;
  if (status === "PAGADO")   return 1;
  return 0;
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.status === "CANCELADO") notFound();

  const current = stepIndex(order.status);
  const adminWa = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "573150014381";
  const waText  = encodeURIComponent(
    `Hola Masterpiece! 👋 Adjunto mi comprobante de pago para el pedido:\n${order.productName}${order.size ? ` — ${order.size}` : ""}\n\nID: ${order.id}`
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#1a1209] py-4 px-6 flex items-center justify-center">
        <Link href="/">
          <Image src="/logo.png" alt="Masterpiece CTG" width={140} height={40} className="h-9 w-auto object-contain" />
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 w-full max-w-md overflow-hidden">
          {/* Producto */}
          <div className="p-5 border-b border-stone-100">
            <p className="text-xs text-stone-400 font-mono mb-2">Pedido #{order.id.slice(-8).toUpperCase()}</p>
            <h1 className="font-bold text-lg leading-tight">{order.productName}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {order.size && (
                <span className="text-sm text-stone-500">Talla: <strong>{order.size}</strong></span>
              )}
              <span className="text-sm font-bold text-amber-600">{order.price}</span>
              <span className="text-sm text-stone-400">{DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-5 space-y-0">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Estado del pedido</h2>
            {STATUS_STEPS.map((step, i) => {
              const done    = i <= current;
              const active  = i === current;
              const isLast  = i === STATUS_STEPS.length - 1;
              return (
                <div key={step.key} className="flex gap-4">
                  {/* Icon + line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      done
                        ? active && order.status !== "ENVIADO"
                          ? "bg-amber-100 border-2 border-amber-400"
                          : "bg-green-500"
                        : "bg-stone-100 border-2 border-stone-200"
                    }`}>
                      {done && !active ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : active ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-stone-300" />
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-10 mt-1 ${done && !active ? "bg-green-400" : "bg-stone-200"}`} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="pb-6">
                    <p className={`font-semibold text-sm ${done ? "text-stone-800" : "text-stone-400"}`}>
                      {step.label}
                    </p>
                    {active && (
                      <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA si está pendiente */}
          {order.status === "PENDIENTE" && (
            <div className="px-5 pb-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <Package className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-amber-900 mb-1">Envía tu comprobante de pago</p>
                <p className="text-xs text-amber-700 mb-3">
                  Haz clic abajo para abrir WhatsApp y adjuntar tu comprobante. Una vez confirmado, actualizaremos tu pedido.
                </p>
                <a
                  href={`https://wa.me/${adminWa}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.859L.057 23.75a.5.5 0 0 0 .614.612l5.975-1.56A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.946 9.946 0 0 1-5.127-1.416l-.367-.217-3.793.993 1.01-3.688-.239-.381A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  Enviar comprobante
                </a>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 pb-5 text-center">
            <Link href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
              ← Volver al catálogo
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-stone-400">
        Masterpiece CTG — Cartagena 🇨🇴
      </footer>
    </div>
  );
}
