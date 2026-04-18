"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Tag,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tag },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-brand-darker text-white">
        <div className="p-5 border-b border-gold-800/30">
          <Image
            src="/logo.png"
            alt="Masterpiece CTG"
            width={160}
            height={44}
            className="h-10 w-auto object-contain"
          />
          <p className="text-gold-600 text-xs tracking-widest uppercase mt-2">
            Panel de control
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-gold-500 text-brand-darker font-semibold"
                  : "text-gold-300 hover:bg-gold-900/30 hover:text-gold-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gold-800/30">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gold-500 hover:text-gold-300 transition-colors mb-2"
          >
            <span>Ver catalogo publico →</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gold-600 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-brand-darker text-white flex items-center justify-between px-4 h-14 border-b border-gold-800/30">
        <Image
          src="/logo.png"
          alt="Masterpiece CTG"
          width={130}
          height={36}
          className="h-8 w-auto object-contain"
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-gold-400 hover:bg-gold-900/30"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-brand-darker text-white pt-14">
          <nav className="p-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-gold-500 text-brand-darker font-semibold"
                    : "text-gold-300 hover:bg-gold-900/30"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gold-800/30 space-y-2">
            <Link
              href="/"
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gold-500"
            >
              Ver catalogo publico →
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </div>
        </div>
      )}
    </>
  );
}
