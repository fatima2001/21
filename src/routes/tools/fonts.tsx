import { createFileRoute } from "@tanstack/react-router";
import { PenTool, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/PrivacyNote";
import { UploadZone } from "../../components/UploadZone";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  activateAll,
  activateFont,
  BUILTIN_FONTS,
  listFonts,
  removeFont,
  saveFont,
  type StoredFont,
} from "../../lib/fonts";
import { TELEGRAM_URL } from "../../lib/links";
import { formatBytes } from "../../lib/save";

export const Route = createFileRoute("/tools/fonts")({
  head: () => ({
    meta: [
      { title: "إدارة الخطوط العربية — منصة الأستاذ" },
      {
        name: "description",
        content:
          "ارفع خطوطك بصيغة TTF أو OTF أو WOFF واحفظها على جهازك لاستخدامها في محرر الشهادات.",
      },
      { property: "og:title", content: "إدارة الخطوط — منصة الأستاذ" },
      { property: "og:description", content: "أضف خطوطك الخاصة وجرّبها قبل إنشاء الشهادات." },
    ],
  }),
  component: FontsPage,
});

function FontsPage() {
  const [fonts, setFonts] = useState<StoredFont[]>([]);
  const [sample, setSample] = useState("أحمد محمد علي — نور الهدى — عبدالله");

  useEffect(() => {
    listFonts().then(async (list) => {
      await activateAll(list);
      setFonts(list);
    });
  }, []);

  const upload = async (files: File[]) => {
    for (const file of files) {
      if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) {
        toast.error(`${file.name}: الصيغة غير مدعومة`);
        continue;
      }
      try {
        const font = await saveFont(file);
        await activateFont(font);
        setFonts((prev) => [...prev, font]);
        toast.success(`تم إضافة الخط ${font.family}`);
      } catch {
        toast.error(`تعذر تحميل ${file.name}`);
      }
    }
  };

  const drop = async (font: StoredFont) => {
    await removeFont(font.id);
    setFonts((prev) => prev.filter((f) => f.id !== font.id));
    toast.success("تم حذف الخط من جهازك");
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10">
      <PageHeader
        icon={<PenTool className="size-6" />}
        title="إدارة الخطوط"
        description="ارفع خطوطك العربية لتظهر مباشرة في محرر الشهادات. الخطوط تُحفظ على جهازك فقط ولا تُرفع إلى أي خادم."
      />

      <UploadZone
        accept=".ttf,.otf,.woff,.woff2"
        multiple
        title="ارفع ملفات الخطوط"
        hint="TTF · OTF · WOFF · WOFF2"
        onFiles={upload}
      />

      <Button variant="outline" className="w-fit" asChild>
        <a href={TELEGRAM_URL} target="_blank" rel="noreferrer noopener">
          <Send className="size-4" /> الحصول على الخطوط (قناة تلغرام)
        </a>
      </Button>

      <div className="grid gap-3">
        <Label>نص التجربة</Label>
        <Input value={sample} onChange={(e) => setSample(e.target.value)} />
      </div>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">خطوطك المحفوظة ({fonts.length})</h2>
        {fonts.length === 0 && (
          <p className="text-sm text-muted-foreground">لم تضف خطوطاً بعد.</p>
        )}
        <div className="grid gap-3">
          {fonts.map((font) => (
            <div
              key={font.id}
              className="surface flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="grid gap-1">
                <p className="text-xl" style={{ fontFamily: `"${font.family}", Cairo, sans-serif` }}>
                  {sample}
                </p>
                <p className="text-xs text-muted-foreground">
                  {font.family} · {font.ext.toUpperCase()} · {formatBytes(font.data.byteLength)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => drop(font)}>
                <Trash2 className="size-4 text-destructive" /> حذف
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">خطوط جاهزة في المنصة</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILTIN_FONTS.map((font) => (
            <div key={font.family} className="surface grid gap-1 p-4">
              <p className="text-xl" style={{ fontFamily: `"${font.family}", Cairo, sans-serif` }}>
                {sample}
              </p>
              <p className="text-xs text-muted-foreground">{font.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
