import { Bike, PackageCheck, CreditCard, Clock } from "lucide-react";

const ITEMS = [
  { icon: Bike,         label: "Domicilio en Cartagena"   },
  { icon: PackageCheck, label: "Envíos a toda Colombia"    },
  { icon: CreditCard,   label: "Nequi · Bancolombia · Efectivo" },
  { icon: Clock,        label: "Lun – Dom  9am – 9pm"     },
];

export function TrustBar() {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex items-center gap-3 min-w-max sm:min-w-0 sm:justify-center sm:flex-wrap">
        {ITEMS.map(({ icon: Icon, label }, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Icon className="h-3.5 w-3.5 text-amber-700" />
            </div>
            <span className="text-[11px] font-medium text-stone-600 whitespace-nowrap">
              {label}
            </span>
            {i < ITEMS.length - 1 && (
              <span className="text-stone-300 ml-1 hidden sm:inline">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
