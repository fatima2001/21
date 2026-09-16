import { createFileRoute } from "@tanstack/react-router";
import {
  Bold,
  Download,
  FileDown,
  FilePlus2,
  Italic,
  Loader2,
  Plus,
  Trash2,
  Underline,
  Wand2,
  Copy,
  GripVertical,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PrivacyNote";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { SYMBOL_GROUPS } from "../../lib/symbols";
import { downloadBlob } from "../../lib/save";

export const Route = createFileRoute("/tools/exam-builder")({
  head: () => ({
    meta: [
      { title: "تنضيد الأسئلة بقياس A4 — منصة الأستاذ" },
      {
        name: "description",
        content:
          "أنشئ ورقة امتحان A4 مع أسئلة مستقلة قابلة للتعديل والترتيب والتنسيق.",
      },
      {
        property: "og:title",
        content: "تنضيد الأسئلة — منصة الأستاذ",
      },
      {
        property: "og:description",
        content:
          "منشئ امتحانات A4 مع أسئلة مستقلة قابلة للتحرير والتنسيق والتصدير.",
      },
    ],
  }),
  component: ExamBuilder,
});

const A4_W = 794;
const A4_H = 1123;

type Question = {
  id: string;
  number: number;
  html: string;
};

type ExamPage = {
  id: string;
  questions: Question[];
};

const START_QUESTION = `<p>أجب عن السؤال الآتي:</p>`;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createQuestion(number: number): Question {
  return {
    id: makeId("question"),
    number,
    html: START_QUESTION,
  };
}

function createPage(): ExamPage {
  return {
    id: makeId("page"),
    questions: [createQuestion(1)],
  };
}

function ExamBuilder() {
  // =========================
  // Header
  // =========================

  const [showHeader, setShowHeader] = useState(true);
  const [ministry, setMinistry] = useState("وزارة التربية");
  const [directorate, setDirectorate] = useState(
    "المديرية العامة للتربية",
  );
  const [school, setSchool] = useState("ثانوية النخبة");
  const [examTitle, setExamTitle] = useState("الامتحان الشهري الأول");
  const [subject, setSubject] = useState("الرياضيات");
  const [grade, setGrade] = useState("الصف الخامس العلمي");
  const [duration, setDuration] = useState("ساعة واحدة");
  const [dateText, setDateText] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [headerLine, setHeaderLine] = useState(true);

  // =========================
  // Footer
  // =========================

  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState(
    "مع تمنياتي لكم بالنجاح — مدرس المادة",
  );
  const [footerNote, setFooterNote] = useState("انتهت الأسئلة");
  const [showPageNumber, setShowPageNumber] = useState(true);
  const [footerLine, setFooterLine] = useState(true);

  // =========================
  // Text settings
  // =========================

  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.9);
  const [columns, setColumns] = useState(1);

  // =========================
  // Questions / Pages
  // =========================

  const [pages, setPages] = useState<ExamPage[]>([
    {
      id: makeId("page"),
      questions: [createQuestion(1)],
    },
  ]);

  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(
    null,
  );

  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // =========================
  // Question helpers
  // =========================

  function getNextQuestionNumber() {
    let max = 0;

    for (const page of pages) {
      for (const question of page.questions) {
        max = Math.max(max, question.number);
      }
    }

    return max + 1;
  }

  function updateQuestion(id: string, html: string) {
    setPages((currentPages) =>
      currentPages.map((page) => ({
        ...page,
        questions: page.questions.map((question) =>
          question.id === id
            ? {
                ...question,
                html,
              }
            : question,
        ),
      })),
    );
  }

  function addQuestion(pageIndex: number) {
    const number = getNextQuestionNumber();

    const question = createQuestion(number);

    setPages((currentPages) =>
      currentPages.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              questions: [...page.questions, question],
            }
          : page,
      ),
    );

    setSelectedQuestion(question.id);

    toast.success(`تمت إضافة السؤال ${number}`);
  }

  function duplicateQuestion(pageIndex: number, questionId: string) {
    const page = pages[pageIndex];

    if (!page) return;

    const original = page.questions.find(
      (question) => question.id === questionId,
    );

    if (!original) return;

    const copy: Question = {
      ...original,
      id: makeId("question"),
      number: getNextQuestionNumber(),
    };

    setPages((currentPages) =>
      currentPages.map((currentPage, index) => {
        if (index !== pageIndex) return currentPage;

        const questionIndex = currentPage.questions.findIndex(
          (question) => question.id === questionId,
        );

        const questions = [...currentPage.questions];

        questions.splice(questionIndex + 1, 0, copy);

        return {
          ...currentPage,
          questions,
        };
      }),
    );

    setSelectedQuestion(copy.id);

    toast.success("تم نسخ السؤال");
  }

  function deleteQuestion(pageIndex: number, questionId: string) {
    const page = pages[pageIndex];

    if (!page) return;

    if (page.questions.length === 1) {
      toast.error(
        "لا يمكن حذف آخر سؤال في الصفحة. أضف سؤالاً آخر أولاً.",
      );
      return;
    }

    setPages((currentPages) =>
      currentPages.map((currentPage, index) =>
        index === pageIndex
          ? {
              ...currentPage,
              questions: currentPage.questions.filter(
                (question) => question.id !== questionId,
              ),
            }
          : currentPage,
      ),
    );

    if (selectedQuestion === questionId) {
      setSelectedQuestion(null);
    }
  }

  function moveQuestion(
    pageIndex: number,
    questionIndex: number,
    direction: "up" | "down",
  ) {
    setPages((currentPages) =>
      currentPages.map((page, index) => {
        if (index !== pageIndex) return page;

        const questions = [...page.questions];

        const targetIndex =
          direction === "up"
            ? questionIndex - 1
            : questionIndex + 1;

        if (
          targetIndex < 0 ||
          targetIndex >= questions.length
        ) {
          return page;
        }

        const current = questions[questionIndex];
        questions[questionIndex] = questions[targetIndex];
        questions[targetIndex] = current;

        return {
          ...page,
          questions,
        };
      }),
    );
  }

  // =========================
  // Page helpers
  // =========================

  function addPage() {
    const newPage = {
      id: makeId("page"),
      questions: [createQuestion(getNextQuestionNumber())],
    };

    setPages((currentPages) => [...currentPages, newPage]);

    toast.success("أُضيفت صفحة جديدة");
  }

  function removePage(pageIndex: number) {
    if (pages.length === 1) {
      toast.error("لا يمكن حذف الصفحة الوحيدة");
      return;
    }

    setPages((currentPages) =>
      currentPages.filter((_, index) => index !== pageIndex),
    );

    setSelectedQuestion(null);
  }

  // =========================
  // Formatting
  // =========================

  function getSelectedEditor() {
    if (!selectedQuestion) return null;

    return editorRefs.current[selectedQuestion] ?? null;
  }

  function format(cmd: "bold" | "italic" | "underline") {
    const editor = getSelectedEditor();

    if (!editor) {
      toast.error("اختر سؤالاً أولاً");
      return;
    }

    editor.focus();

    document.execCommand(cmd);

    updateQuestion(selectedQuestion!, editor.innerHTML);
  }

  function insertText(text: string) {
    const editor = getSelectedEditor();

    if (!editor) {
      toast.error("اختر سؤالاً أولاً");
      return;
    }

    editor.focus();

    document.execCommand("insertText", false, text);

    updateQuestion(selectedQuestion!, editor.innerHTML);
  }

  // =========================
  // Logo
  // =========================

  function onLogo(file?: File) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setLogo(String(reader.result));
    };

    reader.readAsDataURL(file);
  }

  // =========================
  // Rendering / Export
  // =========================

  async function renderPage(index: number) {
    const node = pageRefs.current[index];

    if (!node) {
      throw new Error("الصفحة غير جاهزة");
    }

    const { default: html2canvas } = await import(
      "html2canvas-pro"
    );

    return html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
  }

  async function exportPng() {
    setBusy("png");

    try {
      for (let i = 0; i < pages.length; i++) {
        const canvas = await renderPage(i);

        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) =>
              b
                ? resolve(b)
                : reject(new Error("فشل التصدير")),
            "image/png",
          ),
        );

        downloadBlob(
          blob,
          `${examTitle || "أسئلة"}-${i + 1}.png`,
        );
      }

      toast.success("تم تصدير الصور");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر التصدير",
      );
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    setBusy("pdf");

    try {
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await renderPage(i);

        const data = canvas.toDataURL(
          "image/jpeg",
          0.95,
        );

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          data,
          "JPEG",
          0,
          0,
          210,
          297,
        );
      }

      pdf.save(`${examTitle || "أسئلة"}.pdf`);

      toast.success("تم تصدير ملف PDF");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر التصدير",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10">
      <PageHeader
        icon={<Wand2 className="size-6" />}
        title="منشئ الأسئلة"
        description="أنشئ امتحان A4 مع أسئلة مستقلة قابلة للتعديل والترتيب والتنسيق، ثم صدّره PDF أو PNG."
      />

      {/* =========================
          Top toolbar
      ========================= */}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={exportPdf}
          disabled={busy !== null}
        >
          {busy === "pdf" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}

          تصدير PDF
        </Button>

        <Button
          variant="outline"
          onClick={exportPng}
          disabled={busy !== null}
        >
          {busy === "png" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}

          تصدير PNG
        </Button>

        <Button
          variant="outline"
          onClick={addPage}
        >
          <FilePlus2 className="size-4" />
          صفحة جديدة
        </Button>

        <div className="mr-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => format("bold")}
            aria-label="عريض"
          >
            <Bold className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => format("italic")}
            aria-label="مائل"
          >
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

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <div className="grid gap-4 self-start">

          {/* Question controls */}

          <div className="surface grid gap-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold">
                  الأسئلة
                </h2>

                <p className="text-xs text-muted-foreground">
                  كل سؤال عنصر مستقل
                </p>
              </div>

              <Plus className="size-4" />
            </div>

            <div className="grid gap-2">
              {pages.map((page, pageIndex) => (
                <div
                  key={page.id}
                  className="rounded-lg border p-2"
                >
                  <div className="mb-2 text-xs font-bold text-muted-foreground">
                    صفحة {pageIndex + 1}
                  </div>

                  <div className="grid gap-1">
                    {page.questions.map(
                      (question, questionIndex) => (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() =>
                            setSelectedQuestion(
                              question.id,
                            )
                          }
                          className={`flex items-center gap-2 rounded-md px-2 py-2 text-right text-sm transition ${
                            selectedQuestion ===
                            question.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <GripVertical className="size-3 shrink-0" />

                          <span>
                            سؤال {question.number}
                          </span>
                        </button>
                      ),
                    )}
                  </div>

                  <Button
                    className="mt-2 w-full"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      addQuestion(pageIndex)
                    }
                  >
                    <Plus className="size-4" />
                    إضافة سؤال
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Symbols */}

          <div className="surface grid gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">
                الرموز الشائعة
              </h2>

              <span className="text-xs text-muted-foreground">
                اختر سؤالاً أولاً
              </span>
            </div>

            <Tabs
              defaultValue={
                SYMBOL_GROUPS[0]?.id ?? "math"
              }
            >
              <TabsList className="flex h-auto w-full flex-wrap justify-start">
                {SYMBOL_GROUPS.map((group) => (
                  <TabsTrigger
                    key={group.id}
                    value={group.id}
                    className="text-xs"
                  >
                    {group.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {SYMBOL_GROUPS.map((group) => (
                <TabsContent
                  key={group.id}
                  value={group.id}
                  className="mt-3"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <button
                        key={
                          group.id +
                          item.s +
                          item.t
                        }
                        type="button"
                        title={item.t}
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={() =>
                          insertText(item.s)
                        }
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

          {/* Header settings */}

          <div className="surface grid gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">
                إعدادات الرأس
              </h2>

              <Switch
                checked={showHeader}
                onCheckedChange={setShowHeader}
              />
            </div>

            {showHeader && (
              <div className="grid gap-3">
                <Field
                  label="الوزارة"
                  value={ministry}
                  onChange={setMinistry}
                />

                <Field
                  label="المديرية"
                  value={directorate}
                  onChange={setDirectorate}
                />

                <Field
                  label="المدرسة"
                  value={school}
                  onChange={setSchool}
                />

                <Field
                  label="عنوان الامتحان"
                  value={examTitle}
                  onChange={setExamTitle}
                />

                <Field
                  label="المادة"
                  value={subject}
                  onChange={setSubject}
                />

                <Field
                  label="الصف"
                  value={grade}
                  onChange={setGrade}
                />

                <Field
                  label="الزمن"
                  value={duration}
                  onChange={setDuration}
                />

                <Field
                  label="التاريخ"
                  value={dateText}
                  onChange={setDateText}
                />

                <div className="grid gap-1.5">
                  <Label className="text-xs">
                    شعار / صورة
                  </Label>

                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      onLogo(
                        event.target.files?.[0],
                      )
                    }
                  />

                  {logo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setLogo(null)
                      }
                    >
                      <Trash2 className="size-4" />
                      إزالة الشعار
                    </Button>
                  )}
                </div>

                <label className="flex items-center justify-between text-xs">
                  خط فاصل أسفل الرأس

                  <Switch
                    checked={headerLine}
                    onCheckedChange={
                      setHeaderLine
                    }
                  />
                </label>
              </div>
            )}
          </div>

          {/* Footer settings */}

          <div className="surface grid gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">
                إعدادات التذييل
              </h2>

              <Switch
                checked={showFooter}
                onCheckedChange={setShowFooter}
              />
            </div>

            {showFooter && (
              <div className="grid gap-3">
                <Field
                  label="سطر الختام"
                  value={footerNote}
                  onChange={setFooterNote}
                />

                <div className="grid gap-1.5">
                  <Label className="text-xs">
                    نص التذييل
                  </Label>

                  <Textarea
                    value={footerText}
                    onChange={(event) =>
                      setFooterText(
                        event.target.value,
                      )
                    }
                    rows={2}
                  />
                </div>

                <label className="flex items-center justify-between text-xs">
                  إظهار رقم الصفحة

                  <Switch
                    checked={showPageNumber}
                    onCheckedChange={
                      setShowPageNumber
                    }
                  />
                </label>

                <label className="flex items-center justify-between text-xs">
                  خط فاصل أعلى التذييل

                  <Switch
                    checked={footerLine}
                    onCheckedChange={
                      setFooterLine
                    }
                  />
                </label>
              </div>
            )}
          </div>

          {/* Text settings */}

          <div className="surface grid gap-3 p-4">
            <h2 className="font-display font-bold">
              تنسيق النص
            </h2>

            <div className="grid gap-1.5">
              <Label className="text-xs">
                حجم الخط: {fontSize}px
              </Label>

              <input
                type="range"
                min={11}
                max={26}
                value={fontSize}
                onChange={(event) =>
                  setFontSize(
                    Number(event.target.value),
                  )
                }
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">
                تباعد الأسطر: {lineHeight}
              </Label>

              <input
                type="range"
                min={12}
                max={30}
                value={lineHeight * 10}
                onChange={(event) =>
                  setLineHeight(
                    Number(event.target.value) / 10,
                  )
                }
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">
                عدد الأعمدة
              </Label>

              <div className="flex gap-2">
                {[1, 2].map((column) => (
                  <Button
                    key={column}
                    size="sm"
                    variant={
                      columns === column
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setColumns(column)
                    }
                  >
                    {column === 1
                      ? "عمود واحد"
                      : "عمودان"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            CANVAS
        ===================================================== */}

        <div className="grid justify-items-center gap-8 overflow-x-auto">

          {pages.map((page, pageIndex) => (
            <div
              key={page.id}
              className="grid gap-2"
            >
              {/* Page controls */}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  صفحة {pageIndex + 1}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    removePage(pageIndex)
                  }
                >
                  <Trash2 className="size-4" />
                  حذف
                </Button>
              </div>

              {/* A4 PAGE */}

              <div
                ref={(element) => {
                  pageRefs.current[pageIndex] =
                    element;
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
                  fontFamily:
                    '"Cairo", "Tajawal", sans-serif',
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,.12)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >

                {/* HEADER */}

                {showHeader && (
                  <div
                    style={{
                      paddingBottom: 10,
                      marginBottom: 16,
                      borderBottom: headerLine
                        ? "2px solid #111111"
                        : "none",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                        }}
                      >
                        <div>{ministry}</div>
                        <div>{directorate}</div>
                        <div>{school}</div>
                      </div>

                      <div
                        style={{
                          textAlign: "center",
                          flex: 1,
                        }}
                      >
                        {logo && (
                          <img
                            src={logo}
                            alt="شعار"
                            style={{
                              height: 56,
                              margin:
                                "0 auto 6px",
                              objectFit: "contain",
                            }}
                          />
                        )}

                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                          }}
                        >
                          {examTitle}
                        </div>

                        <div
                          style={{
                            fontSize: 14,
                          }}
                        >
                          {subject}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                          textAlign: "left",
                        }}
                      >
                        <div>{grade}</div>

                        <div>
                          الزمن: {duration}
                        </div>

                        {dateText && (
                          <div>
                            التاريخ: {dateText}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* QUESTIONS AREA */}

                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: "grid",
                    gridTemplateColumns:
                      columns === 2
                        ? "repeat(2, minmax(0, 1fr))"
                        : "1fr",
                    columnGap: 32,
                    alignContent: "start",
                    overflow: "hidden",
                  }}
                >
                  {page.questions.map(
                    (
                      question,
                      questionIndex,
                    ) => (
                      <div
                        key={question.id}
                        style={{
                          breakInside: "avoid",
                          pageBreakInside: "avoid",
                          marginBottom: 18,
                          position: "relative",
                        }}
                      >

                        {/* QUESTION TOOLBAR */}

                        {selectedQuestion ===
                          question.id && (
                          <div
                            data-html2canvas-ignore="true"
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: 4,
                              marginBottom: 4,
                              padding: 4,
                              border:
                                "1px solid #d1d5db",
                              borderRadius: 6,
                              background:
                                "#f8fafc",
                              fontSize: 11,
                            }}
                          >
                            <span
                              style={{
                                marginLeft: "auto",
                                fontWeight: 700,
                              }}
                            >
                              سؤال{" "}
                              {question.number}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                moveQuestion(
                                  pageIndex,
                                  questionIndex,
                                  "up",
                                )
                              }
                              title="تحريك للأعلى"
                              style={{
                                padding:
                                  "2px 6px",
                              }}
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                moveQuestion(
                                  pageIndex,
                                  questionIndex,
                                  "down",
                                )
                              }
                              title="تحريك للأسفل"
                              style={{
                                padding:
                                  "2px 6px",
                              }}
                            >
                              ↓
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                duplicateQuestion(
                                  pageIndex,
                                  question.id,
                                )
                              }
                              title="نسخ السؤال"
                              style={{
                                display:
                                  "flex",
                                padding:
                                  "2px 6px",
                              }}
                            >
                              <Copy className="size-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteQuestion(
                                  pageIndex,
                                  question.id,
                                )
                              }
                              title="حذف السؤال"
                              style={{
                                display:
                                  "flex",
                                padding:
                                  "2px 6px",
                              }}
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        )}

                        {/* QUESTION */}

                        <div
                          onClick={() =>
                            setSelectedQuestion(
                              question.id,
                            )
                          }
                          style={{
                            position: "relative",
                            border:
                              selectedQuestion ===
                              question.id
                                ? "1px solid #2563eb"
                                : "1px solid transparent",
                            borderRadius: 6,
                            padding:
                              "8px 10px",
                            cursor: "text",
                          }}
                        >
                          {/* Question number */}

                          <div
                            style={{
                              fontSize,
                              lineHeight,
                              fontWeight: 700,
                              marginBottom: 2,
                              userSelect: "none",
                            }}
                          >
                            س{question.number}:
                          </div>

                          {/* Editable content */}

                          <div
                            ref={(element) => {
                              editorRefs.current[
                                question.id
                              ] = element;
                            }}
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() =>
                              setSelectedQuestion(
                                question.id,
                              )
                            }
                            onInput={(event) =>
                              updateQuestion(
                                question.id,
                                event.currentTarget
                                  .innerHTML,
                              )
                            }
                            dangerouslySetInnerHTML={{
                              __html:
                                question.html,
                            }}
                            style={{
                              outline: "none",
                              fontSize,
                              lineHeight,
                              textAlign: "right",
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {/* ADD QUESTION */}

                <div
                  data-html2canvas-ignore="true"
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: 4,
                  }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      addQuestion(pageIndex)
                    }
                  >
                    <Plus className="size-4" />
                    إضافة سؤال
                  </Button>
                </div>

                {/* FOOTER */}

                {showFooter && (
                  <div
                    style={{
                      paddingTop: 10,
                      marginTop: 12,
                      borderTop: footerLine
                        ? "1px solid #111111"
                        : "none",
                      fontSize: 13,
                      textAlign: "center",
                      lineHeight: 1.8,
                      flexShrink: 0,
                    }}
                  >
                    {footerNote && (
                      <div
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        {footerNote}
                      </div>
                    )}

                    {footerText && (
                      <div>{footerText}</div>
                    )}

                    {showPageNumber && (
                      <div
                        style={{
                          color: "#555555",
                        }}
                      >
                        صفحة {pageIndex + 1} من{" "}
                        {pages.length}
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
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">
        {label}
      </Label>

      <Input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </div>
  );
}
```
