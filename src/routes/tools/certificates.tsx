import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, GraduationCap, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PrivacyNote";
import { UploadZone } from "../../components/UploadZone";
import { FieldControls } from "../../components/certificate/FieldControls";
import { TemplateCanvas } from "../../components/certificate/TemplateCanvas";
import { useFontFamilies } from "../../components/certificate/useFontFamilies";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  canvasToBlob,
  drawCertificate,
  fieldValue,
  loadImageFromFile,
  newField,
  safeFileName,
  type Field,
} from "../../lib/certificate";
import { downloadBlob } from "../../lib/save";

export const Route = createFileRoute("/tools/certificates")({
  head: () => ({
    meta: [
      { title: "إنشاء شهادة لطالب واحد — منصة الأستاذ" },
      {
        name: "description",
        content: "ارفع قالب الشهادة، أضف اسم الطالب وحرّكه بالماوس، اختر الخط ثم احفظ PNG أو JPG.",
      },
      { property: "og:title", content: "إنشاء الشهادات — منصة الأستاذ" },
      { property: "og:description", content: "محرر شهادات يعمل داخل متصفحك مع دعم كامل للعربية." },
    ],
  }),
  component: SingleCertificate,
});

function SingleCertificate() {
  const { families } = useFontFamilies();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fields, setFields] = useState<Field[]>([newField()]);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedField = fields.find((f) => f.id === selected) ?? fields[0];

  const patch = (id: string, p: Partial<Field>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...p } : f)));

  const onTemplate = async (files: File[]) => {
    try {
      const img = await loadImageFromFile(files[0]!);
      setImage(img);
      toast.success("تم تحميل القالب على جهازك");
    } catch {
      toast.error("تعذر قراءة صورة القالب");
    }
  };

  const save = async (type: "image/png" | "image/jpeg") => {
    if (!image) return;
    const canvas = document.createElement("canvas");
    drawCertificate(canvas, image, fields);
    const blob = await canvasToBlob(canvas, type);
    const first = fields[0] ? fieldValue(fields[0]) : "شهادة";
    downloadBlob(blob, `${safeFileName(first)}.${type === "image/png" ? "png" : "jpg"}`);
    toast.success("تم حفظ الشهادة");
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10">
      <PageHeader
        icon={<GraduationCap className="size-6" />}
        title="إنشاء شهادة"
        description="ارفع قالب الشهادة، أضف الحقول وحرّكها بالماوس أو اللمس فوق الصورة، ثم احفظ الصورة."
      />

      {!image ? (
        <UploadZone
          accept="image/*"
          title="ارفع صورة القالب (certificate.png)"
          hint="PNG · JPG · WebP"
          onFiles={onTemplate}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-3">
            <TemplateCanvas
              image={image}
              fields={fields}
              selectedId={selectedField?.id}
              onSelect={setSelected}
              onMove={(id, x, y) => patch(id, { x, y })}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save("image/png")}>
                <Download className="size-4" /> حفظ PNG
              </Button>
              <Button variant="outline" onClick={() => save("image/jpeg")}>
                <Download className="size-4" /> حفظ JPG
              </Button>
              <Button variant="ghost" onClick={() => setImage(null)}>
                تغيير القالب
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/tools/excel-certificates">شهادات جماعية من Excel</Link>
              </Button>
            </div>
          </div>

          <div className="surface grid h-fit gap-5 p-5">
            <div className="grid gap-2">
              <Label>الحقول</Label>
              <div className="flex flex-wrap gap-2">
                {fields.map((f) => (
                  <Button
                    key={f.id}
                    size="sm"
                    variant={selectedField?.id === f.id ? "default" : "outline"}
                    onClick={() => setSelected(f.id)}
                  >
                    {f.key}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const f = newField({ key: "حقل جديد", text: "نص", y: 0.62, fontSize: 0.05 });
                    setFields((prev) => [...prev, f]);
                    setSelected(f.id);
                  }}
                >
                  <Plus className="size-4" /> إضافة حقل
                </Button>
              </div>
            </div>

            {selectedField && (
              <FieldControls
                field={selectedField}
                families={families}
                onChange={(p) => patch(selectedField.id, p)}
                onRemove={() => {
                  setFields((prev) => prev.filter((f) => f.id !== selectedField.id));
                  setSelected(null);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
