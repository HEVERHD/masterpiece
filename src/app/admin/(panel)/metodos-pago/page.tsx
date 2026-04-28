"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus, Trash2, GripVertical, Eye, EyeOff,
  ChevronUp, ChevronDown, Pencil, Check, X, Smartphone,
} from "lucide-react";

interface PaymentMethod {
  id:       string;
  title:    string;
  subtitle: string | null;
  value:    string | null;
  appLink:  string | null;
  order:    number;
  active:   boolean;
}

const EMPTY_FORM = { title: "", subtitle: "", value: "", appLink: "" };

export default function MetodosPagoPage() {
  const [methods,  setMethods]  = useState<PaymentMethod[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editData, setEditData] = useState(EMPTY_FORM);

  const fetchMethods = useCallback(async () => {
    try {
      const res  = await fetch("/api/metodos-pago");
      const data = await res.json();
      setMethods(data);
    } catch {
      toast.error("Error al cargar métodos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  // ── Create ────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/metodos-pago", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm(EMPTY_FORM);
      toast.success("Método agregado");
      fetchMethods();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  // ── Patch helper ──────────────────────────────────────────
  async function patch(id: string, data: object) {
    const res = await fetch("/api/metodos-pago", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error();
  }

  // ── Toggle active ─────────────────────────────────────────
  async function toggleActive(m: PaymentMethod) {
    try {
      await patch(m.id, { active: !m.active });
      setMethods((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x))
      );
    } catch {
      toast.error("Error al actualizar");
    }
  }

  // ── Reorder ───────────────────────────────────────────────
  async function move(index: number, dir: -1 | 1) {
    const next = [...methods];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    const updated = next.map((m, i) => ({ ...m, order: i }));
    setMethods(updated);
    try {
      await Promise.all(updated.map((m) => patch(m.id, { order: m.order })));
    } catch {
      toast.error("Error al reordenar");
      fetchMethods();
    }
  }

  // ── Save inline edit ──────────────────────────────────────
  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await patch(id, editData);
      setMethods((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                title:    editData.title,
                subtitle: editData.subtitle || null,
                value:    editData.value    || null,
                appLink:  editData.appLink  || null,
              }
            : m
        )
      );
      setEditId(null);
      toast.success("Guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/metodos-pago", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success("Eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Métodos de pago</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Se muestran al cliente al finalizar su pedido.
        </p>
      </div>

      {/* ── Add form ── */}
      <Card>
        <CardContent className="pt-5">
          <p className="font-semibold text-sm mb-3">Agregar método</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Título <span className="text-red-400">*</span>
                  <span className="text-stone-400 font-normal ml-1">(incluye el emoji aquí)</span>
                </label>
                <input
                  required
                  placeholder="🏦 Bancolombia"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-9 rounded-md border border-input px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Subtítulo <span className="text-stone-400">(opcional)</span>
                </label>
                <input
                  placeholder="Cuenta Ahorro · Darío Marín"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full h-9 rounded-md border border-input px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Valor a copiar <span className="text-stone-400">(opcional)</span>
                </label>
                <input
                  placeholder="91289105137"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full h-9 rounded-md border border-input px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Abrir app <span className="text-stone-400">(opcional — deep link, ej: </span>
                  <code className="text-stone-500 text-[11px]">bancolombia://</code>
                  <span className="text-stone-400">, </span>
                  <code className="text-stone-500 text-[11px]">nequi://</code>
                  <span className="text-stone-400">, </span>
                  <code className="text-stone-500 text-[11px]">daviplata://</code>
                  <span className="text-stone-400">)</span>
                </label>
                <input
                  placeholder="bancolombia://"
                  value={form.appLink}
                  onChange={(e) => setForm({ ...form, appLink: e.target.value })}
                  className="w-full h-9 rounded-md border border-input px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── List ── */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : methods.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
          No hay métodos de pago. Agrega el primero arriba.
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map((m, index) => (
            <Card key={m.id} className={`overflow-hidden transition-opacity ${m.active ? "" : "opacity-50"}`}>
              <CardContent className="p-3">
                {editId === m.id ? (
                  /* ── Inline edit ── */
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full h-9 rounded-md border border-amber-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      placeholder="🏦 Bancolombia"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editData.subtitle}
                        onChange={(e) => setEditData({ ...editData, subtitle: e.target.value })}
                        className="h-9 rounded-md border border-input px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Subtítulo"
                      />
                      <input
                        value={editData.value}
                        onChange={(e) => setEditData({ ...editData, value: e.target.value })}
                        className="h-9 rounded-md border border-input px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Valor a copiar"
                      />
                    </div>
                    <input
                      value={editData.appLink}
                      onChange={(e) => setEditData({ ...editData, appLink: e.target.value })}
                      className="w-full h-9 rounded-md border border-input px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="bancolombia://"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={saving}
                        onClick={() => saveEdit(m.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                        <X className="h-3.5 w-3.5" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Display row ── */
                  <div className="flex items-center gap-3">
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <GripVertical className="h-3.5 w-3.5 text-stone-300 mx-auto" />
                      <button
                        onClick={() => move(index, 1)}
                        disabled={index === methods.length - 1}
                        className="p-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{m.title}</p>
                      {m.subtitle && (
                        <p className="text-xs text-muted-foreground">{m.subtitle}</p>
                      )}
                      {m.value && (
                        <p className="text-xs font-mono text-amber-600 mt-0.5">{m.value}</p>
                      )}
                      {m.appLink && (
                        <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                          <Smartphone className="h-2.5 w-2.5" />
                          {m.appLink}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(m)}
                        title={m.active ? "Ocultar" : "Mostrar"}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        {m.active
                          ? <Eye className="h-4 w-4" />
                          : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditId(m.id);
                          setEditData({
                            title:    m.title,
                            subtitle: m.subtitle ?? "",
                            value:    m.value    ?? "",
                            appLink:  m.appLink  ?? "",
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-amber-500 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
