"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al subir imagen");
    }

    const data = await res.json();
    return data.url as string;
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (images.length >= maxImages) {
        toast.error(`Maximo ${maxImages} imagenes permitidas`);
        return;
      }

      const remaining = maxImages - images.length;
      const filesToUpload = files.slice(0, remaining);

      setUploading(true);
      try {
        const urls = await Promise.all(filesToUpload.map(uploadFile));
        onChange([...images, ...urls]);
        toast.success(`${urls.length} imagen(es) subida(s)`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al subir");
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      handleFiles(files);
    },
    [handleFiles]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Upload area */}
      {images.length < maxImages && (
        <label
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragging
              ? "border-amber-400 bg-amber-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Subiendo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload className="h-6 w-6" />
              <span className="text-sm font-medium">
                Arrastra o haz clic para subir
              </span>
              <span className="text-xs text-gray-400">
                JPG, PNG, WebP — max 5MB — ({images.length}/{maxImages})
              </span>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              handleFiles(files);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden border group"
            >
              <Image
                src={url}
                alt={`Foto ${i + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-xs text-center py-0.5">
                  Principal
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
