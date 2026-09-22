"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MAX_IMAGES } from "@/lib/validations/image";

function ImageLightbox({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        type="button"
        className={cn("block cursor-zoom-in", className)}
        aria-label={`Ampliar ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="size-full object-cover" />
      </DialogTrigger>
      <DialogContent className="max-w-3xl border-none bg-transparent p-0 ring-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] w-full rounded-xl object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}

async function fileToCompressedDataUrl(file: File, maxDimension = 640, quality = 0.75) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/webp", quality);
}

export function ImageUpload({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(defaultValue ?? null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessing(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPreview(dataUrl);
    } catch (err) {
      console.error("image-upload:", err);
      setError("Não foi possível carregar essa imagem. Tente outra foto.");
    } finally {
      setProcessing(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex size-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
        {preview ? (
          <ImageLightbox src={preview} alt="Foto do produto" className="size-full" />
        ) : (
          <ImageIcon className="size-10 text-muted-foreground/40" />
        )}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs text-muted-foreground">
            Processando...
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input type="hidden" name={name} value={preview ?? ""} />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-3.5" />
          {preview ? "Trocar foto" : "Adicionar foto"}
        </Button>
        {preview && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
            <X className="size-3.5" />
            Remover
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function MultiImageUpload({
  name,
  defaultValue,
  max = MAX_IMAGES,
}: {
  name: string;
  defaultValue?: string[];
  max?: number;
}) {
  const [images, setImages] = useState<string[]>(defaultValue ?? []);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const slotsLeft = max - images.length;
    setError(slotsLeft < files.length ? `Você só pode adicionar mais ${slotsLeft} foto(s).` : null);
    if (slotsLeft <= 0) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setProcessing(true);
    try {
      const dataUrls = await Promise.all(
        files.slice(0, slotsLeft).map((file) => fileToCompressedDataUrl(file))
      );
      setImages((prev) => [...prev, ...dataUrls]);
    } catch (err) {
      console.error("multi-image-upload:", err);
      setError("Não foi possível carregar uma das imagens. Tente outra foto.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {images.map((src, index) => (
          <div
            key={index}
            className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
          >
            <ImageLightbox src={src} alt={`Foto ${index + 1}`} className="size-full" />
            <input type="hidden" name={name} value={src} />
            <Button
              type="button"
              variant="secondary"
              size="icon-xs"
              className="absolute top-1 right-1 rounded-full"
              onClick={() => handleRemove(index)}
              aria-label={`Remover foto ${index + 1}`}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}

        {images.length < max && (
          <Button
            type="button"
            variant="outline"
            className="size-28 shrink-0 flex-col gap-1 border-dashed"
            onClick={() => inputRef.current?.click()}
            disabled={processing}
          >
            <Upload className="size-5" />
            <span className="text-xs">{processing ? "Processando..." : "Adicionar"}</span>
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-xs text-muted-foreground">
        {images.length}/{max} fotos
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
