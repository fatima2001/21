import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Link2, Lock, Pencil, Trash2, Upload } from "lucide-react";

import { Button } from "../components/ui/button";
import { adImageSrc } from "../components/AdSlot";
import {
  createAd,
  deleteAd,
  listAllAds,
  updateAd,
  verifyAdminCode,
  type Ad,
} from "../lib/ads.functions";
import {
  deleteArticle,
  listAllArticles,
  saveArticle,
  uploadArticleImage,
  type Article,
} from "../lib/articles.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — منصة الأستاذ" },
      { name: "description", content: "إدارة الإعلانات والمقالات في منصة الأستاذ." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة التحكم — منصة الأستاذ" },
      { property: "og:description", content: "إدارة الإعلانات والمقالات." },
    ],
  }),
  component: AdminPage,
});

const STORAGE_KEY = "ustath-admin-code";

function fileToBase64(file: File): Promise<string> {
  return file.arrayBuffer().then((buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
  });
}

function AdminPage() {
  const verify = useServerFn(verifyAdminCode);
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"ads" | "articles">("ads");

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    verify({ data: { code: saved } })
      .then(() => {
        setCode(saved);
        setAuthed(true);
      })
      .catch(() => sessionStorage.removeItem(STORAGE_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await verify({ data: { code } });
      sessionStorage.setItem(STORAGE_KEY, code);
      setAuthed(true);
    } catch {
      toast.error("رمز الدخول غير صحيح");
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20">
        <form onSubmit={handleLogin} className="surface grid gap-4 p-6">
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            <h1 className="font-display text-lg font-bold">لوحة التحكم</h1>
          </div>
          <p className="text-sm text-muted-foreground">أدخل رمز الدخول الخاص بك.</p>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="رمز الدخول"
            className="h-11 rounded-xl border border-border bg-background px-3"
          />
          <Button type="submit" disabled={busy || !code}>
            دخول
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-10">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-bold">لوحة التحكم</h1>
      </div>
      <div className="flex gap-2">
        <Button variant={tab === "ads" ? "default" : "outline"} onClick={() => setTab("ads")}>
          الإعلانات
        </Button>
        <Button
          variant={tab === "articles" ? "default" : "outline"}
          onClick={() => setTab("articles")}
        >
          المقالات
        </Button>
      </div>
      {tab === "ads" ? <AdsPanel code={code} /> : <ArticlesPanel code={code} />}
    </div>
  );
}

function AdsPanel({ code }: { code: string }) {
  const fetchAll = useServerFn(listAllAds);
  const create = useServerFn(createAd);
  const update = useServerFn(updateAd);
  const remove = useServerFn(deleteAd);

  const [ads, setAds] = useState<Ad[]>([]);
  const [busy, setBusy] = useState(false);
  const [placement, setPlacement] = useState<"home" | "tools">("home");
  const [linkUrl, setLinkUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const rows = await fetchAll({ data: { code } });
    setAds(rows as Ad[]);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("اختر صورة أولاً");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة أكبر من 5 ميغابايت");
      return;
    }
    setBusy(true);
    try {
      await create({
        data: {
          code,
          fileBase64: await fileToBase64(file),
          contentType: file.type || "image/jpeg",
          linkUrl,
          placement,
          sortOrder: ads.length,
        },
      });
      setLinkUrl("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
      toast.success("تمت إضافة الإعلان");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, patchData: Partial<Ad>) {
    try {
      await update({
        data: {
          code,
          id,
          ...(patchData.link_url !== undefined ? { linkUrl: patchData.link_url } : {}),
          ...(patchData.placement !== undefined ? { placement: patchData.placement } : {}),
          ...(patchData.is_active !== undefined ? { isActive: patchData.is_active } : {}),
          ...(patchData.sort_order !== undefined ? { sortOrder: patchData.sort_order } : {}),
        },
      });
      await load();
    } catch {
      toast.error("تعذّر الحفظ");
    }
  }

  return (
    <>
      <section className="surface grid gap-4 p-6">
        <h2 className="font-display font-bold">إضافة صورة إعلانية</h2>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="rounded-xl border border-border bg-background p-2 text-sm"
        />
        <label className="grid gap-1 text-sm">
          رابط عند الضغط (اختياري)
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            dir="ltr"
            className="h-11 rounded-xl border border-border bg-background px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          مكان الظهور
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as "home" | "tools")}
            className="h-11 rounded-xl border border-border bg-background px-3"
          >
            <option value="home">الصفحة الرئيسية</option>
            <option value="tools">صفحات الأدوات</option>
          </select>
        </label>
        <Button onClick={handleUpload} disabled={busy}>
          <Upload className="size-4" />
          رفع الإعلان
        </Button>
      </section>

      <section className="grid gap-3">
        <h2 className="font-display font-bold">الإعلانات الحالية ({ads.length})</h2>
        {ads.length === 0 && <p className="text-sm text-muted-foreground">لا توجد إعلانات بعد.</p>}
        {ads.map((ad) => (
          <div key={ad.id} className="surface grid gap-3 p-4 sm:grid-cols-[160px_1fr]">
            <img
              src={adImageSrc(ad.image_url)}
              alt="إعلان"
              className="h-24 w-full rounded-lg object-cover"
            />
            <div className="grid gap-2">
              <input
                defaultValue={ad.link_url ?? ""}
                onBlur={(e) => patch(ad.id, { link_url: e.target.value })}
                placeholder="رابط الإعلان"
                dir="ltr"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={ad.placement}
                  onChange={(e) => patch(ad.id, { placement: e.target.value })}
                  className="h-10 rounded-lg border border-border bg-background px-2 text-sm"
                >
                  <option value="home">الرئيسية</option>
                  <option value="tools">الأدوات</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patch(ad.id, { is_active: !ad.is_active })}
                >
                  {ad.is_active ? "إيقاف" : "تفعيل"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await remove({ data: { code, id: ad.id } });
                    await load();
                  }}
                >
                  <Trash2 className="size-4" />
                  حذف
                </Button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function ArticlesPanel({ code }: { code: string }) {
  const fetchAll = useServerFn(listAllArticles);
  const save = useServerFn(saveArticle);
  const remove = useServerFn(deleteArticle);
  const uploadImage = useServerFn(uploadArticleImage);

  const [articles, setArticles] = useState<Article[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverName, setCoverName] = useState<string | null>(null);
  const [published, setPublished] = useState(true);
  const coverRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  async function load() {
    const rows = await fetchAll({ data: { code } });
    setArticles(rows as Article[]);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setCoverName(null);
    setPublished(true);
    if (coverRef.current) coverRef.current.value = "";
  }

  function startEdit(article: Article) {
    setEditingId(article.id);
    setTitle(article.title);
    setExcerpt(article.excerpt ?? "");
    setContent(article.content);
    setCoverName(article.cover_image);
    setPublished(article.is_published);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadOne(file: File): Promise<string | null> {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة أكبر من 5 ميغابايت");
      return null;
    }
    const result = (await uploadImage({
      data: {
        code,
        fileBase64: await fileToBase64(file),
        contentType: file.type || "image/jpeg",
      },
    })) as { name: string };
    return result.name;
  }

  async function handleCover() {
    const file = coverRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const name = await uploadOne(file);
      if (name) {
        setCoverName(name);
        toast.success("تم رفع صورة الغلاف");
      }
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  async function handleInlineImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const name = await uploadOne(file);
      if (name) {
        const snippet = `\n\n![${file.name.replace(/\.[^.]+$/, "")}](${name})\n\n`;
        const el = contentRef.current;
        const start = el?.selectionStart ?? content.length;
        setContent((prev) => prev.slice(0, start) + snippet + prev.slice(start));
        toast.success("أُدرجت الصورة داخل المقال");
      }
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  function handleInsertLink() {
    const url = window.prompt("ألصق رابط الموقع (مثال: https://example.com)");
    if (!url) return;
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
      toast.error("الرابط يجب أن يبدأ بـ https:// أو http://");
      return;
    }
    const label = window.prompt("نص الرابط الذي سيظهر للقارئ", trimmed) || trimmed;
    const snippet = `[${label}](${trimmed})`;
    const el = contentRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? start;
    setContent((prev) => prev.slice(0, start) + snippet + prev.slice(end));
    toast.success("أُدرج الرابط داخل المقال");
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("اكتب عنوان المقال أولاً");
      return;
    }
    setBusy(true);
    try {
      await save({
        data: {
          code,
          ...(editingId ? { id: editingId } : {}),
          title,
          excerpt,
          content,
          coverImage: coverName,
          isPublished: published,
        },
      });
      resetForm();
      await load();
      toast.success("تم حفظ المقال");
    } catch {
      toast.error("تعذّر حفظ المقال");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="surface grid gap-4 p-6">
        <h2 className="font-display font-bold">
          {editingId ? "تعديل المقال" : "مقال جديد"}
        </h2>

        <label className="grid gap-1 text-sm">
          العنوان
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          مقدمة قصيرة (اختياري)
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          نص المقال
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="rounded-xl border border-border bg-background p-3 text-sm leading-relaxed"
          />
        </label>
        <p className="text-xs text-muted-foreground" dir="rtl">
          تنسيقات مدعومة: عنوان فرعي بسطر يبدأ بـ ## — رابط بالشكل [النص](https://example.com) —
          صورة بالشكل ![وصف](اسم-الصورة) ويمكنك إدراجها بزر «إدراج صورة».
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inlineImageRef.current?.click()}
            disabled={busy}
          >
            <ImagePlus className="size-4" />
            إدراج صورة داخل المقال
          </Button>
          <Button variant="outline" size="sm" onClick={handleInsertLink} disabled={busy}>
            <Link2 className="size-4" />
            إدراج رابط
          </Button>
          <input
            ref={inlineImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInlineImage}
          />
        </div>

        <div className="grid gap-2 text-sm">
          صورة الغلاف (اختياري)
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="rounded-xl border border-border bg-background p-2 text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleCover} disabled={busy}>
              رفع الغلاف
            </Button>
            {coverName && <span className="text-xs text-primary">تم اختيار الغلاف</span>}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="size-4"
          />
          نشر المقال (ظاهر للزوار)
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={busy}>
            {editingId ? "حفظ التعديلات" : "حفظ المقال"}
          </Button>
          {editingId && (
            <Button variant="ghost" onClick={resetForm}>
              إلغاء التعديل
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-display font-bold">المقالات ({articles.length})</h2>
        {articles.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مقالات بعد.</p>}
        {articles.map((article) => (
          <div key={article.id} className="surface flex flex-wrap items-center gap-3 p-4">
            <div className="grid flex-1 gap-1">
              <span className="font-display font-bold">{article.title}</span>
              <span className="text-xs text-muted-foreground">
                {article.is_published ? "منشور" : "مسودة (مخفي عن الزوار)"}
                {article.is_published && (
                  <>
                    {" — "}
                    <Link
                      to="/articles/$slug"
                      params={{ slug: article.slug }}
                      className="text-primary underline underline-offset-2"
                    >
                      عرض
                    </Link>
                  </>
                )}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => startEdit(article)}>
              <Pencil className="size-4" />
              تعديل
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await remove({ data: { code, id: article.id } });
                if (editingId === article.id) resetForm();
                await load();
              }}
            >
              <Trash2 className="size-4" />
              حذف
            </Button>
          </div>
        ))}
      </section>
    </>
  );
}
