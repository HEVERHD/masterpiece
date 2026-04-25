"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categorias");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Error al cargar categorias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleDelete(cat: Category) {
    if (!confirm(`¿Eliminar "${cat.name}"?`)) return;
    setDeleting(cat.id);
    try {
      const res = await fetch("/api/categorias", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      toast.success(`"${cat.name}" eliminada`);
      fetchCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear");
      }

      toast.success("Categoria creada");
      setNewName("");
      fetchCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Organiza tu inventario por categorias
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              placeholder="Ej: Camisas, Pantalones, Vestidos..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={saving || !newName.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Creando..." : "Crear"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay categorias. Crea la primera.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{cat.name}</span>
                    <Badge variant="secondary">
                      {cat._count.products} producto
                      {cat._count.products !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {cat._count.products === 0 && (
                    <button
                      className="text-red-400 hover:text-red-600 p-1 transition-colors disabled:opacity-40"
                      disabled={deleting === cat.id}
                      onClick={() => handleDelete(cat)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
