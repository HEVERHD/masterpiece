"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SizeManager } from "./SizeManager";
import { ImageUploader } from "./ImageUploader";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  categoryId: z.string().min(1, "Selecciona una categoria"),
  isVisible: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    categoryId: string;
    isVisible: boolean;
    sizes: { size: string; stock: number }[];
    images: { url: string }[];
  };
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>(
    product?.sizes ?? []
  );
  const [images, setImages] = useState<string[]>(
    product?.images.map((i) => i.url) ?? []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      categoryId: product?.categoryId ?? "",
      isVisible: product?.isVisible ?? true,
    },
  });

  const isVisible = watch("isVisible");

  async function onSubmit(values: FormValues) {
    const payload = { ...values, sizes, images };

    const url = isEditing
      ? `/api/productos/${product.id}`
      : "/api/productos";

    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Error al guardar producto");
      return;
    }

    toast.success(
      isEditing ? "Producto actualizado" : "Producto creado exitosamente"
    );
    router.push("/admin/productos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacion del articulo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Camisa manga larga cuadros"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el material, el estilo..."
                  rows={3}
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (COP) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="85000"
                    {...register("price")}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select
                    defaultValue={product?.categoryId}
                    onValueChange={(v) => setValue("categoryId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotos del articulo</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                images={images}
                onChange={setImages}
                maxImages={5}
              />
            </CardContent>
          </Card>

          {/* Sizes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tallas y Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <SizeManager sizes={sizes} onChange={setSizes} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isVisible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">
                    {isVisible ? "Visible en catalogo" : "Oculto del catalogo"}
                  </span>
                </div>
                <Switch
                  checked={isVisible}
                  onCheckedChange={(v) => setValue("isVisible", v)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isVisible
                  ? "Los clientes pueden ver este articulo."
                  : "Este articulo esta oculto. Los clientes no lo veran."}
              </p>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? "Guardar cambios" : "Crear articulo"}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  );
}
