export type Align = "right" | "center" | "left";

export type Field = {
  id: string;
  /** اسم الحقل، ويُستخدم كمفتاح ربط مع أعمدة Excel */
  key: string;
  /** النص الظاهر في وضع الشهادة الواحدة أو نص المعاينة */
  text: string;
  /** نسبة من عرض/ارتفاع القالب (0..1) */
  x: number;
  y: number;
  /** نسبة من ارتفاع القالب */
  fontSize: number;
  /** نسبة من عرض القالب: أقصى عرض للنص */
  maxWidth: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  align: Align;
  rotation: number;
  letterSpacing: number;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export function newField(partial: Partial<Field> = {}): Field {
  return {
    id: uid(),
    key: "الاسم",
    text: "أحمد محمد",
    x: 0.5,
    y: 0.5,
    fontSize: 0.07,
    maxWidth: 0.8,
    fontFamily: "Cairo",
    color: "#1a3b47",
    bold: true,
    align: "center",
    rotation: 0,
    letterSpacing: 0,
    ...partial,
  };
}

export function fieldValue(field: Field, row?: Record<string, string>) {
  if (!row) return field.text;
  const value = row[field.key];
  return value !== undefined && value !== "" ? String(value) : field.text;
}

/** يرسم القالب والحقول على Canvas بأبعاد الصورة الأصلية */
export function drawCertificate(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | ImageBitmap,
  fields: Field[],
  row?: Record<string, string>,
) {
  const w = "naturalWidth" in image ? image.naturalWidth : image.width;
  const h = "naturalHeight" in image ? image.naturalHeight : image.height;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(image as CanvasImageSource, 0, 0, w, h);
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";

  for (const field of fields) {
    const text = fieldValue(field, row);
    if (!text) continue;
    let size = field.fontSize * h;
    const maxWidth = field.maxWidth * w;

    ctx.save();
    ctx.translate(field.x * w, field.y * h);
    ctx.rotate((field.rotation * Math.PI) / 180);
    ctx.fillStyle = field.color;
    ctx.textAlign = field.align === "right" ? "right" : field.align === "left" ? "left" : "center";
    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        `${field.letterSpacing * size}px`;
    }

    // تصغير تلقائي حتى لا تخرج الأسماء الطويلة من مكانها
    for (let i = 0; i < 40; i++) {
      ctx.font = `${field.bold ? "700" : "400"} ${size}px "${field.fontFamily}", "Cairo", sans-serif`;
      if (ctx.measureText(text).width <= maxWidth || size <= 8) break;
      size -= Math.max(1, size * 0.04);
    }
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذر قراءة الصورة"));
    };
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("تعذر إنشاء الصورة"))),
      type,
      quality,
    );
  });
}

export function safeFileName(name: string) {
  return (name || "شهادة").replace(/[\\/:*?"<>|]/g, "_").trim();
}
