import { createFileRoute } from "@tanstack/react-router";
import { Award, Download, FileSpreadsheet, FolderDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PrivacyNote";
import { UploadZone } from "../../components/UploadZone";
import { FieldControls } from "../../components/certificate/FieldControls";
import { TemplateCanvas } from "../../components/certificate/TemplateCanvas";
import { useFontFamilies } from "../../components/certificate/useFontFamilies";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
import { Textarea } from "../../components/ui/textarea";
import {
  canvasToBlob,
  drawCertificate,
  loadImageFromFile,
  newField,
  safeFileName,
  type Field,
} from "../../lib/certificate";
import { downloadBlob, pickDirectory, supportsDirectoryPicker, writeToDirectory } from "../../lib/save";
import { readSheet } from "../../lib/sheet";

export const Route = createFileRoute("/tools/excel-certificates")({
  head: () => ({
    meta: [
      { title: "شهادات جماعية — اكتب الأسماء أو ارفع Excel — منصة الأستاذ" },
      {
        name: "description",
        content:
          "أنشئ شهادات تقديرية بالاسم فقط أو شهادات درجات لعدد كبير من الطلاب: اكتب الأسماء يدوياً أو ارفع ملف Excel، والمعالجة كلها على جهازك.",
      },
      { property: "og:title", content: "شهادات جماعية — منصة الأستاذ" },
      {
        property: "og:description",
        content: "شهادة تقديرية بالاسم فقط أو شهادة درجات، لمئات الطلاب بضغطة واحدة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BulkCertificates,
});

type Mode = "appreciation" | "grades";
type Row = Record<string, string>;

const NAME = "الاسم";
const GRADE = "الدرجة";

/** تحويل النص المكتوب يدوياً إلى صفوف: كل سطر طالب، ويمكن كتابة الدرجة بعد فاصلة */
function parseManual(text: string, mode: Mode): Row[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,،\t]|\s-\s/).map((p) => p.trim());
      const row: Row = { [NAME]: parts[0] ?? "" };
      if (mode === "grades") row[GRADE] = parts[1] ?? "";
      return row;
    })
    .filter((r) => r[NAME]);
}

function BulkCertificates() {
  const { families } = useFontFamilies();
  const [mode, setMode] = useState<Mode>("appreciation");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [manual, setManual] = useState("");
  const [sheetRows, setSheetRows] = useState<Row[]>([]);
  const [sheetColumns, setSheetColumns] = useState<string[]>([]);
  const [fields, setFields] = useState<Field[]>([newField({ key: NAME })]);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const rows = useMemo(
    () => (sheetRows.length ? sheetRows : parseManual(manual, mode)),
    [sheetRows, manual, mode],
  );
  const columns = sheetColumns.length
    ? sheetColumns
    : mode === "grades"
      ? [NAME, GRADE]
      : [NAME];

  const selectedField = fields.find((f) => f.id === selected) ?? fields[0];
  const patch = (id: string, p: Partial<Field>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...p } : f)));

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === "grades" && !fields.some((f) => f.key === GRADE)) {
      setFields((prev) => [
        ...prev,
        newField({ key: GRADE, text: "95", y: 0.66, fontSize: 0.05, bold: false }),
      ]);
    }
    if (next === "appreciation") {
      setFields((prev) => {
        const kept = prev.filter((f) => f.key !== GRADE);
        return kept.length ? kept : [newField({ key: NAME })];
      });
    }
  };

  const onTemplate = async (files: File[]) => {
    try {
      setImage(await loadImageFromFile(files[0]!));
      toast.success("تم تحميل القالب على جهازك");
    } catch {
      toast.error("تعذر قراءة صورة القالب");
    }
  };

  const onSheet = async (files: File[]) => {
    try {
      const data = await readSheet(files[0]!);
      if (!data.rows.length) {
        toast.error("الملف فارغ أو غير مقروء");
        return;
      }
      setSheetRows(data.rows);
      setSheetColumns(data.columns);
      const first = data.columns[0] ?? NAME;
      setFields((prev) =>
        prev.map((f) => (data.columns.includes(f.key) ? f : { ...f, key: first })),
      );
      toast.success(`تم قراءة ${data.rows.length} صفاً على جهازك`);
    } catch {
      toast.error("تعذر قراءة الملف");
    }
  };

  const generate = async () => {
    if (!image || !rows.length) return;
    setProgress({ done: 0, total: rows.length });
    const dir = supportsDirectoryPicker() ? await pickDirectory() : null;
    const canvas = document.createElement("canvas");
    const nameKey = fields[0]?.key ?? NAME;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      drawCertificate(canvas, image, fields, row);
      const blob = await canvasToBlob(canvas, "image/png");
      const file = `${String(i + 1).padStart(3, "0")}-${safeFileName(row[nameKey] || `طالب-${i + 1}`)}.png`;
      if (dir) await writeToDirectory(dir, file, blob);
      else downloadBlob(blob, file);
      setProgress({ done: i + 1, total: rows.length });
      await new Promise((r) => setTimeout(r, dir ? 0 : 120));
    }

    setProgress(null);
    toast.success(`تم إنشاء ${rows.length} شهادة`);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10">
      <PageHeader
        icon={<FileSpreadsheet className="size-6" />}
        title="شهادات جماعية"
        description="اكتب أسماء الطلاب يدوياً — سطر لكل طالب — أو ارفع ملف Excel. اختر شهادة تقديرية بالاسم فقط أو شهادة درجات."
      />

      <div className="surface grid gap-4 p-5">
        <Label>نوع الشهادة</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "appreciation" ? "default" : "outline"}
            onClick={() => switchMode("appreciation")}
          >
            <Award className="size-4" /> شهادة تقديرية (اسم فقط)
          </Button>
          <Button variant={mode === "grades" ? "default" : "outline"} onClick={() => switchMode("grades")}>
            <FileSpreadsheet className="size-4" /> شهادة درجات (اسم + درجة)
          </Button>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="names">
            {mode === "grades" ? "الأسماء والدرجات — سطر لكل طالب: الاسم، الدرجة" : "الأسماء — سطر لكل طالب"}
          </Label>
          <Textarea
            id="names"
            rows={6}
            dir="rtl"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={
              mode === "grades" ? "أحمد محمد، 95\nسارة علي، 88" : "أحمد محمد\nسارة علي\nمريم حسن"
            }
            disabled={sheetRows.length > 0}
          />
          <p className="text-xs text-muted-foreground">
            {sheetRows.length > 0
              ? `يتم استخدام ملف Excel (${sheetRows.length} صفاً). احذف الملف للكتابة يدوياً.`
              : `عدد الطلاب: ${rows.length}`}
          </p>
        </div>

        {sheetRows.length > 0 ? (
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => {
              setSheetRows([]);
              setSheetColumns([]);
            }}
          >
            حذف ملف Excel
          </Button>
        ) : (
          <UploadZone
            accept=".xlsx,.xls,.csv"
            title="أو ارفع ملف Excel / CSV (اختياري)"
            hint="XLSX · XLS · CSV — يُقرأ على جهازك فقط"
            onFiles={onSheet}
          />
        )}
      </div>

      {!image ? (
        <UploadZone
          accept="image/*"
          title="ارفع صورة قالب الشهادة"
          hint="PNG · JPG · WebP"
          onFiles={onTemplate}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-3">
            <TemplateCanvas
              image={image}
              fields={fields}
              row={rows[preview]}
              selectedId={selectedField?.id}
              onSelect={setSelected}
              onMove={(id, x, y) => patch(id, { x, y })}
            />
            {rows.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Label>معاينة طالب</Label>
                <Button size="sm" variant="outline" onClick={() => setPreview((p) => Math.max(0, p - 1))}>
                  السابق
                </Button>
                <span className="text-sm text-muted-foreground">
                  {Math.min(preview + 1, rows.length)} / {rows.length}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreview((p) => Math.min(rows.length - 1, p + 1))}
                >
                  التالي
                </Button>
              </div>
            )}

            {progress ? (
              <div className="grid gap-2">
                <Progress value={(progress.done / progress.total) * 100} />
                <p className="text-sm text-muted-foreground">
                  جارٍ الإنشاء {progress.done} من {progress.total}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={generate} disabled={!rows.length}>
                  {supportsDirectoryPicker() ? (
                    <FolderDown className="size-4" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  إنشاء {rows.length || ""} شهادة
                </Button>
                <Button variant="ghost" onClick={() => setImage(null)}>
                  تغيير القالب
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {supportsDirectoryPicker()
                ? "سيُطلب منك اختيار مجلد على جهازك لحفظ الشهادات فيه."
                : "سيتم تنزيل الشهادات صورة بعد صورة إلى مجلد التنزيلات."}
            </p>
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
                    const f = newField({
                      key: columns[0] ?? "حقل جديد",
                      text: "نص",
                      y: 0.72,
                      fontSize: 0.045,
                    });
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
                columns={columns}
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
