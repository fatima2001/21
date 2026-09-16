import { createFileRoute } from "@tanstack/react-router";
import { Download, ImageDown, Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PrivacyNote";
import { UploadZone } from "../../components/UploadZone";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
import { Slider } from "../../components/ui/slider";
import {
  compressImage,
  renameWithFormat,
  supportsFormat,
  type OutputFormat,
} from "../../lib/compress";
import { downloadBlob, formatBytes } from "../../lib/save";

export const Route = createFileRoute("/tools/image-compressor")({
  head: () => ({
    meta: [
      { title: "ضغط الصور محلياً — منصة الأستاذ" },
      {
        name: "description",
        content: "اضغط وحوّل صورك بصيغ JPG وWebP وAVIF داخل المتصفح بدون رفعها إلى أي خادم.",
      },
      { property: "og:title", content: "ضغط الصور — منصة الأستاذ" },
      { property: "og:description", content: "ضغط وتحويل الصور بدون رفعها إلى الإنترنت." },
    ],
  }),
  component: ImageCompressor,
});

type Item = {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  result?: { blob: Blob; url: string; name: string; width: number; height: number };
  busy?: boolean;
};

const QUALITY_PRESETS = [
  { label: "عالية", value: 0.9 },
  { label: "متوسطة", value: 0.72 },
  { label: "منخفضة", value: 0.5 },
];

const TARGETS = [
  { label: "بدون حد", value: 0 },
  { label: "100 KB", value: 100 * 1024 },
  { label: "250 KB", value: 250 * 1024 },
  { label: "500 KB", value: 500 * 1024 },
  { label: "1 MB", value: 1024 * 1024 },
];

function ImageCompressor() {
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(0.72);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [maxWidth, setMaxWidth] = useState(0);
  const [target, setTarget] = useState(0);
  const [customTarget, setCustomTarget] = useState("");
  const [avifOk, setAvifOk] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    supportsFormat("image/avif").then(setAvifOk);
  }, []);

  const totals = useMemo(() => {
    const done = items.filter((i) => i.result);
    const before = done.reduce((s, i) => s + i.originalSize, 0);
    const after = done.reduce((s, i) => s + (i.result?.blob.size ?? 0), 0);
    return { before, after, saved: before ? (1 - after / before) * 100 : 0, count: done.length };
  }, [items]);

  const addFiles = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      toast.error("اختر صوراً بصيغة JPG أو PNG أو WebP");
      return;
    }
    setItems((prev) => [
      ...prev,
      ...images.map((file) => ({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        preview: URL.createObjectURL(file),
        originalSize: file.size,
      })),
    ]);
  };

  const targetBytes = target === -1 ? Number(customTarget) * 1024 || 0 : target;

  const runAll = async () => {
    const list = itemsRef.current;
    if (!list.length) return;
    setProgress({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      const item = list[i]!;
      try {
        const res = await compressImage(item.file, { quality, format, maxWidth, targetBytes });
        const url = URL.createObjectURL(res.blob);
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  result: {
                    blob: res.blob,
                    url,
                    name: renameWithFormat(item.file.name, format),
                    width: res.width,
                    height: res.height,
                  },
                }
              : p,
          ),
        );
      } catch {
        toast.error(`تعذر ضغط ${item.file.name}`);
      }
      setProgress({ done: i + 1, total: list.length });
      await new Promise((r) => setTimeout(r, 0));
    }
    setProgress(null);
    toast.success("تم ضغط الصور على جهازك");
  };

  const downloadAll = () => {
    const ready = items.filter((i) => i.result);
    ready.forEach((item, index) =>
      setTimeout(() => downloadBlob(item.result!.blob, item.result!.name), index * 250),
    );
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10">
      <PageHeader
        icon={<ImageDown className="size-6" />}
        title="ضغط الصور"
        description="اسحب صورك هنا واضغطها بجودة تختارها أو بحجم مستهدف. المعالجة تتم بالكامل داخل متصفحك."
      />

      <UploadZone
        accept="image/*"
        multiple
        title="اسحب الصور هنا أو اضغط للاختيار"
        hint="JPG · JPEG · PNG · WebP · AVIF"
        onFiles={addFiles}
      />

      <div className="surface grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2">
          <Label>الجودة</Label>
          <div className="flex flex-wrap gap-1">
            {QUALITY_PRESETS.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant={quality === p.value ? "default" : "outline"}
                onClick={() => setQuality(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Slider
            dir="rtl"
            value={[Math.round(quality * 100)]}
            min={10}
            max={100}
            step={1}
            onValueChange={([v]) => setQuality((v ?? 80) / 100)}
          />
          <span className="text-xs text-muted-foreground">مخصصة: {Math.round(quality * 100)}%</span>
        </div>

        <div className="grid gap-2">
          <Label>الحجم المستهدف</Label>
          <select
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {TARGETS.map((t) => (
              <option key={t.label} value={t.value}>
                {t.label}
              </option>
            ))}
            <option value={-1}>مخصص (KB)</option>
          </select>
          {target === -1 && (
            <Input
              type="number"
              inputMode="numeric"
              placeholder="مثلاً 300"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
            />
          )}
        </div>

        <div className="grid gap-2">
          <Label>صيغة الإخراج</Label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as OutputFormat)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="image/jpeg">JPG</option>
            <option value="image/webp">WebP</option>
            <option value="image/png">PNG</option>
            <option value="image/avif" disabled={!avifOk}>
              AVIF {avifOk ? "" : "(غير مدعوم في متصفحك)"}
            </option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label>أقصى عرض (بكسل)</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={maxWidth || ""}
            placeholder="الأبعاد الأصلية"
            onChange={(e) => setMaxWidth(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runAll} disabled={!items.length || !!progress}>
          {progress ? <Loader2 className="size-4 animate-spin" /> : null}
          ضغط {items.length ? `(${items.length})` : ""}
        </Button>
        <Button variant="outline" onClick={downloadAll} disabled={!totals.count}>
          <Download className="size-4" /> تنزيل الكل
        </Button>
        {items.length > 0 && (
          <Button variant="ghost" onClick={() => setItems([])}>
            <Trash2 className="size-4" /> إزالة الكل
          </Button>
        )}
      </div>

      {progress && (
        <div className="grid gap-2">
          <Progress value={(progress.done / progress.total) * 100} />
          <p className="text-sm text-muted-foreground">
            جاري الضغط {progress.done} / {progress.total}
          </p>
        </div>
      )}

      {totals.count > 0 && (
        <div className="surface grid gap-1 p-5 text-sm">
          <p>
            قبل: <strong>{formatBytes(totals.before)}</strong> — بعد:{" "}
            <strong>{formatBytes(totals.after)}</strong>
          </p>
          <p className="font-medium text-primary">تم توفير: {totals.saved.toFixed(1)}%</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="surface overflow-hidden">
            <img
              src={item.result?.url ?? item.preview}
              alt={item.file.name}
              loading="lazy"
              className="h-40 w-full bg-muted object-contain"
            />
            <div className="grid gap-1 p-4 text-sm">
              <p className="truncate font-medium" title={item.file.name}>
                {item.file.name}
              </p>
              <p className="text-muted-foreground">قبل: {formatBytes(item.originalSize)}</p>
              {item.result && (
                <>
                  <p className="text-muted-foreground">
                    بعد: {formatBytes(item.result.blob.size)} · {item.result.width}×
                    {item.result.height}
                  </p>
                  <p className="font-medium text-primary">
                    توفير {((1 - item.result.blob.size / item.originalSize) * 100).toFixed(1)}%
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-fit"
                    onClick={() => downloadBlob(item.result!.blob, item.result!.name)}
                  >
                    <Download className="size-4" /> حفظ
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
