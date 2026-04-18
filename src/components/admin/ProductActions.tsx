"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ProductActionsProps {
  productId: string;
}

export function ProductActions({ productId }: ProductActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "¿Eliminar este producto? Esta accion no se puede deshacer."
      )
    )
      return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/productos/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast.success("Producto eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar producto");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="h-8 w-8"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 bg-white border rounded-lg shadow-lg py-1 min-w-[140px]">
            <Link
              href={`/admin/productos/${productId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
