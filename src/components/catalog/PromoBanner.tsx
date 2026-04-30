import { Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getPromo() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["promo_active", "promo_text", "promo_label"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    active: map.promo_active !== "false",
    text:   map.promo_text  ?? "Envío gratis en pedidos mayores a $150.000 — Solo Cartagena 🛵",
    label:  map.promo_label ?? "Envío gratis",
  };
}

export async function PromoBanner() {
  const { active, text, label } = await getPromo();
  if (!active) return null;

  // Construir el texto mostrando la etiqueta en dorado y el resto normal
  const rest = text.replace(label, "").trim();

  return (
    <div className="bg-[#1a1209] rounded-2xl px-5 py-3.5 flex items-center justify-center gap-3">
      <Truck className="h-4 w-4 text-amber-400 flex-shrink-0" />
      <p className="text-amber-100 text-xs sm:text-sm font-medium text-center">
        <span className="text-amber-400 font-bold">{label}</span>
        {rest ? ` ${rest}` : ""}
      </p>
    </div>
  );
}
