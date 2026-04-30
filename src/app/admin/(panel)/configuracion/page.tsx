"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Tag, Truck, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConfiguracionPage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const [active,    setActive]    = useState(true);
  const [label,     setLabel]     = useState("Envío gratis");
  const [text,      setText]      = useState("");
  const [threshold, setThreshold] = useState("150000");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setActive(data.promo_active === "true");
        setLabel(data.promo_label ?? "Envío gratis");
        setText(data.promo_text ?? "");
        setThreshold(data.promo_threshold ?? "150000");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promo_active:    String(active),
          promo_label:     label,
          promo_text:      text,
          promo_threshold: threshold,
        }),
      });
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajustes generales de la tienda
        </p>
      </div>

      {/* Promo banner */}
      <div className="border rounded-2xl p-5 space-y-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-sm">Banner promocional</h2>
          </div>
          <button
            onClick={() => setActive((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium"
          >
            {active ? (
              <><ToggleRight className="h-5 w-5 text-green-500" /><span className="text-green-600">Activo</span></>
            ) : (
              <><ToggleLeft className="h-5 w-5 text-stone-400" /><span className="text-stone-400">Inactivo</span></>
            )}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">
              Etiqueta destacada <span className="text-stone-400">(ej: &ldquo;Envío gratis&rdquo;)</span>
            </label>
            <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2.5">
              <Tag className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="flex-1 text-sm bg-transparent focus:outline-none"
                placeholder="Envío gratis"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">
              Texto completo del banner
            </label>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
              placeholder="Envío gratis en pedidos mayores a $150.000 — Solo Cartagena 🛵"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">
              Umbral para envío gratis <span className="text-stone-400">(en pesos, sin puntos)</span>
            </label>
            <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2.5">
              <span className="text-stone-400 text-sm font-mono">$</span>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="flex-1 text-sm bg-transparent focus:outline-none font-mono"
                placeholder="150000"
                min={0}
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Cuando el carrito supere este monto se muestra la alerta de envío gratis
            </p>
          </div>
        </div>

        {/* Preview */}
        {active && (
          <div className="bg-[#1a1209] rounded-xl px-4 py-3 flex items-center justify-center gap-2">
            <Truck className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-100 text-xs text-center">
              <span className="text-amber-400 font-bold">{label || "Envío gratis"}</span>
              {" "}
              {text.replace(label, "").trim() || `en pedidos mayores a $${Number(threshold).toLocaleString("es-CO")} — Solo Cartagena`}
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar cambios
      </Button>
    </div>
  );
}
