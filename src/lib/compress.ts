export type OutputFormat = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export type CompressOptions = {
  quality: number; // 0..1
  format: OutputFormat;
  maxWidth?: number; // 0 = الأبعاد الأصلية
  targetBytes?: number; // 0 = بدون حجم مستهدف
};

export type CompressResult = {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
};

export async function supportsFormat(format: OutputFormat) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 2;
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, format, 0.8));
  return !!blob && blob.type === format;
}

function toBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("تعذر ضغط الصورة"))),
      format,
      quality,
    ),
  );
}

/** ضغط الصورة داخل المتصفح فقط — لا يتم إرسال أي بايت إلى الإنترنت. */
export async function compressImage(file: File, options: CompressOptions): Promise<CompressResult> {
  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  if (options.maxWidth && options.maxWidth > 0 && width > options.maxWidth) {
    height = Math.round((options.maxWidth / width) * height);
    width = options.maxWidth;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر تهيئة Canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const isPng = options.format === "image/png";
  let quality = isPng ? 1 : options.quality;
  let blob = await toBlob(canvas, options.format, quality);

  // بحث ثنائي للوصول إلى الحجم المستهدف
  if (!isPng && options.targetBytes && options.targetBytes > 0) {
    let low = 0.05;
    let high = quality;
    for (let i = 0; i < 8 && blob.size > options.targetBytes; i++) {
      quality = (low + high) / 2;
      const candidate = await toBlob(canvas, options.format, quality);
      if (candidate.size > options.targetBytes) high = quality;
      else low = quality;
      blob = candidate;
    }
  }

  return { blob, width, height, quality };
}

export const EXTENSIONS: Record<OutputFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function renameWithFormat(name: string, format: OutputFormat) {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}.${EXTENSIONS[format]}`;
}
