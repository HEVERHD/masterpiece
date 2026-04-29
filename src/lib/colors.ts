export const PRODUCT_COLORS = [
  { label: "Negro",    value: "negro",    hex: "#1a1a1a" },
  { label: "Blanco",   value: "blanco",   hex: "#e8e4db" },
  { label: "Gris",     value: "gris",     hex: "#9e9e9e" },
  { label: "Azul",     value: "azul",     hex: "#2563eb" },
  { label: "Rojo",     value: "rojo",     hex: "#dc2626" },
  { label: "Verde",    value: "verde",    hex: "#16a34a" },
  { label: "Beige",    value: "beige",    hex: "#d4b896" },
  { label: "Café",     value: "cafe",     hex: "#78350f" },
  { label: "Naranja",  value: "naranja",  hex: "#ea580c" },
  { label: "Rosado",   value: "rosado",   hex: "#ec4899" },
  { label: "Morado",   value: "morado",   hex: "#7c3aed" },
  { label: "Amarillo", value: "amarillo", hex: "#eab308" },
] as const;

export type ProductColorValue = typeof PRODUCT_COLORS[number]["value"];
