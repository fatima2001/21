import { useEffect, useRef } from "react";

import { drawCertificate, type Field } from "../../lib/certificate";
import { cn } from "../../lib/utils";

type Props = {
  image: HTMLImageElement;
  fields: Field[];
  row?: Record<string, string> | undefined;
  selectedId?: string | null | undefined;
  onSelect?: ((id: string) => void) | undefined;
  onMove?: ((id: string, x: number, y: number) => void) | undefined;
  className?: string | undefined;
};

/** معاينة مباشرة: النص يُرسم على Canvas بنفس طريقة التصدير، والحقول قابلة للتحريك بالماوس أو اللمس. */
export function TemplateCanvas({
  image,
  fields,
  row,
  selectedId,
  onSelect,
  onMove,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = requestAnimationFrame(() => drawCertificate(canvas, image, fields, row));
    return () => cancelAnimationFrame(raf);
  }, [image, fields, row]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawCertificate(canvas, image, fields, row);
  }, [image, fields, row]);

  const handlePointer = (event: React.PointerEvent) => {
    const id = dragging.current;
    const box = boxRef.current;
    if (!id || !box || !onMove) return;
    const rect = box.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    onMove(id, x, y);
  };

  return (
    <div
      ref={boxRef}
      className={cn("checker relative w-full touch-none overflow-hidden rounded-xl border border-border", className)}
      onPointerMove={handlePointer}
      onPointerUp={() => (dragging.current = null)}
      onPointerLeave={() => (dragging.current = null)}
    >
      <canvas ref={canvasRef} className="block h-auto w-full" />
      {onMove &&
        fields.map((field) => (
          <button
            key={field.id}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              dragging.current = field.id;
              onSelect?.(field.id);
            }}
            style={{
              left: `${field.x * 100}%`,
              top: `${field.y * 100}%`,
              width: `${field.maxWidth * 100}%`,
              height: `${Math.max(field.fontSize * 1.5, 0.05) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${field.rotation}deg)`,
            }}
            className={cn(
              "absolute cursor-move rounded-md border-2 border-dashed border-transparent transition-colors",
              selectedId === field.id
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50 hover:bg-primary/5",
            )}
            aria-label={`تحريك حقل ${field.key}`}
          >
            {selectedId === field.id && (
              <span className="absolute -top-6 right-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                {field.key}
              </span>
            )}
          </button>
        ))}
    </div>
  );
}
