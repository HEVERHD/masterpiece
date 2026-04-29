import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle, Clock, Instagram, Facebook } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-brand-darker border-t border-gold-800/30 mt-16">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Image
              src="/logo.png"
              alt="Masterpiece CTG"
              width={180}
              height={50}
              className="h-11 w-auto object-contain mb-4"
            />
            <p className="text-gold-500/80 text-sm leading-relaxed">
              Ropa y accesorios de moda con estilo en Cartagena de Indias.
              Outfits que elevan tu look diario.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://www.instagram.com/tutiendampc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gold-900/40 border border-gold-800/40 flex items-center justify-center text-gold-400 hover:text-white hover:bg-gold-800/60 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/Masterpiecectg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gold-900/40 border border-gold-800/40 flex items-center justify-center text-gold-400 hover:text-white hover:bg-gold-800/60 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/57"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Catálogo */}
          <div>
            <h3 className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-4">
              Catálogo
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "Todo",        href: "/"                        },
                { label: "Gorras",      href: "/?category=gorras"        },
                { label: "Bermudas",    href: "/?category=bermudas"      },
                { label: "Boxers",      href: "/?category=boxer"         },
                { label: "Accesorios",  href: "/?category=accesorios"    },
                { label: "Novedades",   href: "/?sort="                  },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-gold-600 hover:text-gold-300 text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-4">
              Información
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "Cómo pedir",        href: "/" },
                { label: "Domicilios",         href: "/" },
                { label: "Envíos nacionales",  href: "/" },
                { label: "Métodos de pago",    href: "/" },
                { label: "Avísame si hay stock", href: "/" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-gold-600 hover:text-gold-300 text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-gold-600">
                <MapPin className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>Cartagena de Indias,<br />Bolívar, Colombia</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gold-600">
                <Clock className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>Lun – Dom<br />9:00 am – 9:00 pm</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gold-600">
                <MessageCircle className="h-4 w-4 text-[#25D366] mt-0.5 flex-shrink-0" />
                <span>Pedidos por WhatsApp<br />con domicilio a toda la ciudad</span>
              </li>
            </ul>

            {/* Payments */}
            <div className="mt-5">
              <p className="text-gold-700 text-xs mb-2 uppercase tracking-wider">Pagos aceptados</p>
              <div className="flex flex-wrap gap-1.5">
                {["Nequi", "Bancolombia", "DaviPlata", "Efectivo"].map((m) => (
                  <span
                    key={m}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-gold-800/40 text-gold-600"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold-800/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gold-800 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Masterpiece CTG · Cartagena de Indias 🇨🇴
          </p>
          <p className="text-gold-800 text-xs text-center sm:text-right">
            Desarrollado por{" "}
            <span className="text-gold-500 font-semibold">Hevert David</span>
            {" "}·{" "}
            <span className="text-gold-600">Desarrollador Front-End Profesional</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
