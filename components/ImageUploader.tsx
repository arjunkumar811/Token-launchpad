"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";
import Image from "next/image";

import { cn, formatFileSize } from "@/lib/utils";

type ImageUploaderProps = {
  error?: string;
  onChange: (file: File | null) => void;
  value?: File | null;
};

export function ImageUploader({ error, onChange, value }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onChange(file);
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="token-image"
        className={cn(
          "flex min-h-[154px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-600 bg-zinc-800 px-5 py-8 text-center transition-colors duration-200 hover:border-cyan-400",
          error && "border-red-500",
        )}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Token preview"
            width={144}
            height={144}
            unoptimized
            className="h-24 w-24 rounded-2xl object-cover"
          />
        ) : (
          <ImagePlus className="h-10 w-10 text-zinc-500" />
        )}
        <div className="space-y-1">
          <p className="text-base font-semibold text-zinc-100">Upload Image</p>
          {value ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-700 bg-cyan-950/30 px-3 py-1 text-sm text-cyan-200">
              <UploadCloud className="h-3.5 w-3.5" />
              {value.name} ({formatFileSize(value.size)})
            </p>
          ) : null}
        </div>
      </label>
      <input
        id="token-image"
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
