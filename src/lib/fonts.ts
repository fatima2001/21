import { del, get, keys, set } from "idb-keyval";

export type StoredFont = {
  id: string;
  name: string;
  family: string;
  ext: string;
  data: ArrayBuffer;
};

const PREFIX = "font:";

export const BUILTIN_FONTS = [
  { family: "Cairo", label: "Cairo" },
  { family: "Tajawal", label: "Tajawal" },
  { family: "Amiri", label: "Amiri (نسخي)" },
  { family: "Reem Kufi", label: "Reem Kufi" },
  { family: "Aref Ruqaa", label: "Aref Ruqaa (رقعة)" },
  { family: "Noto Kufi Arabic", label: "Noto Kufi Arabic" },
];

function sanitizeFamily(name: string) {
  return name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, "").replace(/["']/g, "");
}

export async function listFonts(): Promise<StoredFont[]> {
  const all = await keys();
  const fontKeys = all.filter((k) => typeof k === "string" && k.startsWith(PREFIX)) as string[];
  const items = await Promise.all(fontKeys.map((k) => get<StoredFont>(k)));
  return items.filter(Boolean).sort((a, b) => a!.name.localeCompare(b!.name)) as StoredFont[];
}

export async function saveFont(file: File): Promise<StoredFont> {
  const data = await file.arrayBuffer();
  const family = sanitizeFamily(file.name);
  const font: StoredFont = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    family,
    ext: file.name.split(".").pop() ?? "ttf",
    data,
  };
  await set(PREFIX + font.id, font);
  return font;
}

export async function removeFont(id: string) {
  await del(PREFIX + id);
}

export async function clearFonts() {
  const all = await keys();
  await Promise.all(
    (all.filter((k) => typeof k === "string" && k.startsWith(PREFIX)) as string[]).map((k) =>
      del(k),
    ),
  );
}

const loaded = new Set<string>();

export async function activateFont(font: StoredFont) {
  if (loaded.has(font.family)) return;
  const face = new FontFace(font.family, font.data.slice(0));
  await face.load();
  document.fonts.add(face);
  loaded.add(font.family);
}

export async function activateAll(fonts: StoredFont[]) {
  await Promise.all(
    fonts.map((f) =>
      activateFont(f).catch(() => {
        /* ignore invalid font files */
      }),
    ),
  );
}
