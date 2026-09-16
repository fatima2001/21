import { createServerFn } from "@tanstack/react-start";

export type AdPlacement = "home" | "tools";

export type Ad = {
  id: string;
  image_url: string;
  link_url: string | null;
  placement: string;
  sort_order: number;
  is_active: boolean;
};

function assertCode(code: unknown): string {
  const expected = process.env["ADMIN_ACCESS_CODE"];
  if (typeof code !== "string" || !expected || code.trim() !== expected) {
    throw new Error("INVALID_CODE");
  }
  return code.trim();
}

export const listAds = createServerFn({ method: "GET" })
  .inputValidator((input: { placement?: string; all?: boolean }) => input ?? {})
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("ads")
      .select("id, image_url, link_url, placement, sort_order, is_active")
      .order("sort_order", { ascending: true });

    if (!data.all) query = query.eq("is_active", true);
    if (data.placement) query = query.eq("placement", data.placement);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as Ad[];
  });

export const verifyAdminCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    assertCode(data.code);
    return { ok: true };
  });

export const listAllAds = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    assertCode(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("ads")
      .select("id, image_url, link_url, placement, sort_order, is_active")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Ad[];
  });

export const createAd = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      code: string;
      fileBase64: string;
      contentType: string;
      linkUrl?: string;
      placement: string;
      sortOrder?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    assertCode(data.code);
    if (!data.fileBase64) throw new Error("NO_IMAGE");

    const bytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("TOO_LARGE");

    const ext = (data.contentType.split("/")[1] ?? "jpg").replace(/[^a-z0-9]/gi, "");
    const name = `${crypto.randomUUID()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const up = await supabaseAdmin.storage.from("ads").upload(name, bytes, {
      contentType: data.contentType || "image/jpeg",
      upsert: false,
    });
    if (up.error) throw new Error(up.error.message);

    const { error } = await supabaseAdmin.from("ads").insert({
      image_url: name,
      link_url: data.linkUrl?.trim() || null,
      placement: data.placement === "tools" ? "tools" : "home",
      sort_order: data.sortOrder ?? 0,
      is_active: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateAd = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      code: string;
      id: string;
      linkUrl?: string | null;
      placement?: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    assertCode(data.code);
    const patch: {
      link_url?: string | null;
      placement?: string;
      sort_order?: number;
      is_active?: boolean;
    } = {};
    if (data.linkUrl !== undefined) patch.link_url = data.linkUrl?.trim() || null;
    if (data.placement !== undefined)
      patch.placement = data.placement === "tools" ? "tools" : "home";
    if (data.sortOrder !== undefined) patch.sort_order = data.sortOrder;
    if (data.isActive !== undefined) patch.is_active = data.isActive;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAd = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; id: string }) => input)
  .handler(async ({ data }) => {
    assertCode(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("ads")
      .select("image_url")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.image_url) {
      await supabaseAdmin.storage.from("ads").remove([row.image_url]);
    }
    const { error } = await supabaseAdmin.from("ads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
