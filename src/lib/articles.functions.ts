import { createServerFn } from "@tanstack/react-start";

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

const ARTICLE_COLUMNS =
  "id, slug, title, excerpt, content, cover_image, is_published, published_at, created_at";

function assertCode(code: unknown): void {
  const expected = process.env["ADMIN_ACCESS_CODE"];
  if (typeof code !== "string" || !expected || code.trim() !== expected) {
    throw new Error("INVALID_CODE");
  }
}

function slugify(input: string): string {
  const base = input
    .trim()
    .replace(/[\s\u200f\u200e]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `article-${Date.now()}`;
}

export const listArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Article[];
});

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("articles")
      .select(ARTICLE_COLUMNS)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as Article | null;
  });

export const listAllArticles = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    assertCode(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("articles")
      .select(ARTICLE_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Article[];
  });

export const saveArticle = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      code: string;
      id?: string;
      title: string;
      excerpt?: string;
      content: string;
      coverImage?: string | null;
      isPublished: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    assertCode(data.code);
    const title = data.title.trim();
    if (!title) throw new Error("NO_TITLE");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title,
      excerpt: data.excerpt?.trim() || null,
      content: data.content ?? "",
      cover_image: data.coverImage || null,
      is_published: data.isPublished,
      published_at: data.isPublished ? new Date().toISOString() : null,
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("articles").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    let slug = slugify(title);
    const { data: existing } = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const { error } = await supabaseAdmin.from("articles").insert({ ...payload, slug });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; id: string }) => input)
  .handler(async ({ data }) => {
    assertCode(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadArticleImage = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; fileBase64: string; contentType: string }) => input)
  .handler(async ({ data }) => {
    assertCode(data.code);
    if (!data.fileBase64) throw new Error("NO_IMAGE");
    const bytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("TOO_LARGE");

    const ext = (data.contentType.split("/")[1] ?? "jpg").replace(/[^a-z0-9]/gi, "");
    const name = `${crypto.randomUUID()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const up = await supabaseAdmin.storage.from("articles").upload(name, bytes, {
      contentType: data.contentType || "image/jpeg",
      upsert: false,
    });
    if (up.error) throw new Error(up.error.message);
    return { name };
  });
