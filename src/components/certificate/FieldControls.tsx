import { AlignCenter, AlignLeft, AlignRight, Bold, Trash2 } from "lucide-react";

import type { Align, Field } from "../../lib/certificate";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { cn } from "../../lib/utils";

type Props = {
  field: Field;
  families: { family: string; label: string }[];
  columns?: string[];
  onChange: (patch: Partial<Field>) => void;
  onRemove: () => void;
  showText?: boolean;
};

export function FieldControls({
  field,
  families,
  columns,
  onChange,
  onRemove,
  showText = true,
}: Props) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>اسم الحقل</Label>
        {columns && columns.length > 0 ? (
          <select
            value={field.key}
            onChange={(e) => onChange({ key: e.target.value })}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <Input value={field.key} onChange={(e) => onChange({ key: e.target.value })} />
        )}
      </div>

      {showText && (
        <div className="grid gap-2">
          <Label>النص</Label>
          <Input
            value={field.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="أحمد محمد"
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label>الخط</Label>
        <select
          value={field.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          style={{ fontFamily: `"${field.fontFamily}", Cairo, sans-serif` }}
        >
          {families.map((f) => (
            <option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"` }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>اللون</Label>
          <input
            type="color"
            value={field.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background p-1"
          />
        </div>
        <div className="grid gap-2">
          <Label>الوزن والمحاذاة</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon"
              variant={field.bold ? "default" : "outline"}
              onClick={() => onChange({ bold: !field.bold })}
              aria-label="عريض"
            >
              <Bold className="size-4" />
            </Button>
            {(
              [
                { v: "right", Icon: AlignRight },
                { v: "center", Icon: AlignCenter },
                { v: "left", Icon: AlignLeft },
              ] as { v: Align; Icon: typeof AlignLeft }[]
            ).map(({ v, Icon }) => (
              <Button
                key={v}
                type="button"
                size="icon"
                variant={field.align === v ? "default" : "outline"}
                onClick={() => onChange({ align: v })}
                aria-label={`محاذاة ${v}`}
              >
                <Icon className="size-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <SliderRow
        label="حجم الخط"
        value={field.fontSize * 1000}
        min={10}
        max={250}
        onChange={(v) => onChange({ fontSize: v / 1000 })}
        display={`${Math.round(field.fontSize * 1000)}`}
      />
      <SliderRow
        label="أقصى عرض للنص"
        value={field.maxWidth * 100}
        min={10}
        max={100}
        onChange={(v) => onChange({ maxWidth: v / 100 })}
        display={`${Math.round(field.maxWidth * 100)}%`}
      />
      <SliderRow
        label="التدوير"
        value={field.rotation}
        min={-45}
        max={45}
        onChange={(v) => onChange({ rotation: v })}
        display={`${Math.round(field.rotation)}°`}
      />
      <SliderRow
        label="المسافة بين الأحرف"
        value={field.letterSpacing * 100}
        min={-5}
        max={30}
        onChange={(v) => onChange({ letterSpacing: v / 100 })}
        display={`${Math.round(field.letterSpacing * 100)}`}
      />

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ x: 0.5 })}>
          توسيط أفقي
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ y: 0.5 })}>
          توسيط رأسي
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("text-destructive")}
          onClick={onRemove}
        >
          <Trash2 className="size-4" /> حذف الحقل
        </Button>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v ?? value)}
        dir="rtl"
      />
    </div>
  );
}
