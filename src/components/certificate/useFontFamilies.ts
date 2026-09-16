import { useEffect, useState } from "react";

import { activateAll, BUILTIN_FONTS, listFonts, type StoredFont } from "../../lib/fonts";

export function useFontFamilies() {
  const [custom, setCustom] = useState<StoredFont[]>([]);

  useEffect(() => {
    let alive = true;
    listFonts().then(async (fonts) => {
      if (!alive) return;
      await activateAll(fonts);
      setCustom(fonts);
    });
    return () => {
      alive = false;
    };
  }, []);

  const families = [
    ...BUILTIN_FONTS,
    ...custom.map((f) => ({ family: f.family, label: `${f.family} (خطك)` })),
  ];

  return { families, custom };
}
