import { Truck } from "lucide-react";

export function PromoBanner() {
  return (
    <div className="bg-[#1a1209] rounded-2xl px-5 py-3.5 flex items-center justify-center gap-3">
      <Truck className="h-4 w-4 text-amber-400 flex-shrink-0" />
      <p className="text-amber-100 text-xs sm:text-sm font-medium text-center">
        <span className="text-amber-400 font-bold">Envío gratis</span>
        {" "}en pedidos mayores a{" "}
        <span className="text-amber-400 font-bold">$150.000</span>
        {" "}— Solo Cartagena 🛵
      </p>
    </div>
  );
}
