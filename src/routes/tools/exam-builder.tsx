import { createFileRoute } from "@tanstack/react-router";
import {
  Bold,
  Download,
  FileDown,
  FilePlus2,
  Italic,
  Loader2,
  Trash2,
  Underline,
  Wand2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PrivacyNote";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { SYMBOL_GROUPS } from "../../lib/symbols";
import { downloadBlob } from "../../lib/save";

export const Route = createFileRoute("/tools/exam-builder")({
  head: () => ({
    meta: [
      { title: "تنضيد الأسئلة بقياس A4 — منصة الأستاذ" },
      {
        name: "description",
        content:
          "نضّد أسئلة الامتحان على صفحة A4 مع رأس وتذييل قابلين للتعديل ورموز الرياضيات والكيمياء، وصدّرها PDF أو PNG.",
      },
      { property: "og:title", content: "تنضيد الأسئلة — منصة الأستاذ" },
      {
        property: "og:description",
        content: "ورقة أسئلة A4 جاهزة للطباعة مع رموز المواد العلمية وتصدير PDF وPNG.",
      },
    ],
  }),
  component: ExamBuilder,
});

const A4_W = 794; // px @96dpi
const A4_H = 1123;

const START_HTML = `<p>س١: أجب عن الأسئلة الآتية:</p><p>أ) ..............................................................</p><p>ب) .............................................................</p>`;

function ExamBuilder() {
  // إعدادات الرأس
  const [showHeader, setShowHeader] = useState(true);
  const [ministry, setMinistry] = useState("وزارة التربية");
  const [directorate, setDirectorate] = useState("المديرية العامة للتربية");
  const [school, setSchool] = useState("ثانوية النخبة");
  const [examTitle, setExamTitle] = useState("الامتحان الشهري الأول");
  const [subject, setSubject] = useState("الرياضيات");
  const [grade, setGrade] = useState("الصف الخامس العلمي");
  const [duration, setDuration] = useState("ساعة واحدة");
  const [dateText, setDateText] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [headerLine, setHeaderLine] = useState(true);

  // إعدادات التذييل
  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState("مع تمنياتي لكم بالنجاح — مدرس المادة");
  const [footerNote, setFooterNote] = useState("انتهت الأسئلة");
  const [showPageNumber, setShowPageNumber] = useState(true);
  const [footerLine, setFooterLine] = useState(true);

  // إعدادات النص
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.9);
  const [columns, setColumns] = useState(1);

  const [pages, setPages] = useState<string[]>([START_HTML]);
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  const editors = useRef<(HTMLDivElement | null)[]>([]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastFocused = useRef(0);

  function focusEditor() {
    const el = editors.current[lastFocused.current] ?? editors.current[0];
    el?.focus();
    return el;
  }

  function insertText(text: string) {
    const el = focusEditor();
    if (!el) return;
    document.execCommand("insertText", false, text);
    syncPage(lastFocused.current);
  }

  function syncPage(index: number) {
    const el = editors.current[index];
    if (!el) return;
    setPages((prev) => prev.map((p, i) => (i === index ? el.innerHTML : p)));
  }

  function format(cmd: "bold" | "italic" | "underline") {
    focusEditor();
    document.execCommand(cmd);
    syncPage(lastFocused.current);
  }

  function addPage() {
    setPages((prev) => [...prev, "<p><br></p>"]);
    toast.success("أُضيفت صفحة جديدة");
  }

  function removePage(index: number) {
    if (pages.length === 1) {
      toast.error("لا يمكن حذف الصفحة الوحيدة");
      return;
    }
    editors.current.splice(index, 1);
    pageRefs.current.splice(index, 1);
    lastFocused.current = 0;
    setPages((prev) => prev.filter((_, i) => i !== index));
  }

  function onLogo(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function renderPage(index: number) {
    const node = pageRefs.current[index];
    if (!node) throw new Error("الصفحة غير جاهزة");
    const { default: html2canvas } = await import("html2canvas-pro");
    return html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  }

  async function exportPng() {
    setBusy("png");
    try {
      for (let i = 0; i < pages.length; i++) {
        const canvas = await renderPage(i);
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("فشل التصدير"))), "image/png"),
        );
        downloadBlob(blob, `${examTitle || "أسئلة"}-${i + 1}.png`);
      }
      toast.success("تم تصدير الصور");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر التصدير");
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    setBusy("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      for (let i = 0; i < pages.length; i++) {
        const canvas = await renderPage(i);
        const data = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(data, "JPEG", 0, 0, 210, 297);
      }
      pdf.save(`${examTitle || "أسئلة"}.pdf`);
      toast.success("تم تصدير ملف PDF");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر التصدير");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10">
      <PageHeader
        icon={<Wand2 className="size-6" />}
        title="تنضيد الأسئلة"
        description="اكتب أسئلتك على صفحة بقياس A4 مع رأس وتذييل بإعدادات منفصلة، وأدرج رموز المواد العلمية، ثم صدّر الورقة PDF أو صورة PNG."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={exportPdf} disabled={busy !== null}>
          {busy === "pdf" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}
          تصدير PDF
        </Button>
        <Button variant="outline" onClick={exportPng} disabled={busy !== null}>
          {busy === "png" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          تصدير PNG
        </Button>
        <Button variant="outline" onClick={addPage}>
          <FilePlus2 className="size-4" />
          صفحة جديدة
        </Button>
        <div className="mr-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => format("bold")} aria-label="عريض">
            <Bold className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => format("italic")} aria-label="مائل">
            <Italic className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => format("underline")}
            aria-label="تحت خط"
          >
            <Underline className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="grid gap-4 self-start">
          {/* الرموز */}
          <div className="surface grid gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">الرموز الشائعة</h2>
              <span className="text-xs text-muted-foreground">اضغط الرمز لإدراجه</span>
            </div>
            <Tabs defaultValue={SYMBOL_GROUPS[0]?.id ?? "math"}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start">
                {SYMBOL_GROUPS.map((g) => (
                  <TabsTrigger key={g.id} value={g.id} className="text-xs">
                    {g.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {SYMBOL_GROUPS.map((g) => (
                <TabsContent key={g.id} value={g.id} className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((item) => (
                      <button
                        key={g.id + item.s + item.t}
                        type="button"
                        title={item.t}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertText(item.s)}
                        className="min-w-9 rounded-lg border border-border bg-card px-2 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        {item.s}
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* إعدادات الرأس */}
          <div className="surface grid gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">إعدادات الرأس</h2>
              <Switch checked={showHeader} onCheckedChange={setShowHeader} />
            </div>
            {showHeader && (
              <div className="grid gap-3">
                <Field label="الوزارة" value={ministry} onChange={setMinistry} />
                <Field label="المديرية" value={directorate} onChange={setDirectorate} />
                <Field label="المدرسة" value={school} onChange={setSchool} />
                <Field label="عنوان الامتحان" value={examTitle} onChange={setExamTitle} />
                <Field label="المادة" value={subject} onChange={setSubject} />
                <Field label="الصف" value={grade} onChange={setGrade} />
                <Field label="الزمن" value={duration} onChange={setDuration} />
                <Field label="التاريخ" value={dateText} onChange={setDateText} />
                <div className="grid gap-1.5">
                  <Label className="text-xs">شعار / صورة (اختياري)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onLogo(e.target.files?.[0])}
                  />
                  {logo && (
                    <Button variant="ghost" size="sm" onClick={() => setLogo(null)}>
                      <Trash2 className="size-4" />
                      إزالة الشعار
                    </Button>
                  )}
                </div>
                <label className="flex items-center justify-between text-xs">
                  خط فاصل أسفل الرأس
                  <Switch checked={headerLine} onCheckedChange={setHeaderLine} />
                </label>
              </div>
            )}
          </div>

          {/* إعدادات التذييل */}
          <div className="surface grid gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">إعدادات التذييل</h2>
              <Switch checked={showFooter} onCheckedChange={setShowFooter} />
            </div>
            {showFooter && (
              <div className="grid gap-3">
                <Field label="سطر الختام" value={footerNote} onChange={setFooterNote} />
                <div className="grid gap-1.5">
                  <Label className="text-xs">نص التذييل</Label>
                  <Textarea
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    rows={2}
                  />
                </div>
                <label className="flex items-center justify-between text-xs">
                  إظهار رقم الصفحة
                  <Switch checked={showPageNumber} onCheckedChange={setShowPageNumber} />
                </label>
                <label className="flex items-center justify-between text-xs">
                  خط فاصل أعلى التذييل
                  <Switch checked={footerLine} onCheckedChange={setFooterLine} />
                </label>
              </div>
            )}
          </div>

          {/* إعدادات النص */}
          <div className="surface grid gap-3 p-4">
            <h2 className="font-display font-bold">تنسيق النص</h2>
            <div className="grid gap-1.5">
              <Label className="text-xs">حجم الخط: {fontSize}px</Label>
              <input
                type="range"
                min={11}
                max={26}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">تباعد الأسطر: {lineHeight}</Label>
              <input
                type="range"
                min={12}
                max={30}
                value={lineHeight * 10}
                onChange={(e) => setLineHeight(Number(e.target.value) / 10)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">عدد الأعمدة</Label>
              <div className="flex gap-2">
                {[1, 2].map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={columns === c ? "default" : "outline"}
                    onClick={() => setColumns(c)}
                  >
                    {c === 1 ? "عمود واحد" : "عمودان"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* الصفحات */}
        <div className="grid justify-items-center gap-8 overflow-x-auto">
          {pages.map((html, index) => (
            <div key={index} className="grid gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>صفحة {index + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removePage(index)}>
                  <Trash2 className="size-4" />
                  حذف
                </Button>
              </div>
              <div
                ref={(el) => {
                  pageRefs.current[index] = el;
                }}
                dir="rtl"
                style={{
                  width: A4_W,
                  height: A4_H,
                  background: "#ffffff",
                  color: "#111111",
                  padding: "48px 56px",
                  display: "flex",
                  flexDirection: "column",
                  fontFamily: '"Cairo", "Tajawal", sans-serif',
                  boxShadow: "0 10px 30px rgba(0,0,0,.12)",
                  borderRadius: 4,
                }}
              >
                {showHeader && (
                  <div
                    style={{
                      paddingBottom: 10,
                      marginBottom: 16,
                      borderBottom: headerLine ? "2px solid #111111" : "none",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                    >
                      <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                        <div>{ministry}</div>
                        <div>{directorate}</div>
                        <div>{school}</div>
                      </div>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        {logo && (
                          <img
                            src={logo}
                            alt="شعار"
                            style={{ height: 56, margin: "0 auto 6px", objectFit: "contain" }}
                          />
                        )}
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{examTitle}</div>
                        <div style={{ fontSize: 14 }}>{subject}</div>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.7, textAlign: "left" }}>
                        <div>{grade}</div>
                        <div>الزمن: {duration}</div>
                        {dateText && <div>التاريخ: {dateText}</div>}
                      </div>
                    </div>
                  </div>
                )}

                <div
                  ref={(el) => {
                    editors.current[index] = el;
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => {
                    lastFocused.current = index;
                  }}
                  onInput={() => syncPage(index)}
                  dangerouslySetInnerHTML={{ __html: html }}
                  style={{
                    flex: 1,
                    outline: "none",
                    fontSize,
                    lineHeight,
                    textAlign: "right",
                    columnCount: columns,
                    columnGap: 32,
                    columnRule: columns > 1 ? "1px solid #cccccc" : undefined,
                  }}
                />

                {showFooter && (
                  <div
                    style={{
                      paddingTop: 10,
                      marginTop: 16,
                      borderTop: footerLine ? "1px solid #111111" : "none",
                      fontSize: 13,
                      textAlign: "center",
                      lineHeight: 1.8,
                    }}
                  >
                    {footerNote && <div style={{ fontWeight: 700 }}>{footerNote}</div>}
                    {footerText && <div>{footerText}</div>}
                    {showPageNumber && (
                      <div style={{ color: "#555555" }}>
                        صفحة {index + 1} من {pages.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
