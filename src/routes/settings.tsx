import { createFileRoute } from "@tanstack/react-router";
import { Moon, Settings as SettingsIcon, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../components/PrivacyNote";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { clearFonts } from "../lib/fonts";
import { clearProjects } from "../lib/projects";
import { useTheme } from "../lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — منصة الأستاذ" },
      {
        name: "description",
        content: "تحكم بالوضع الليلي ونظّف بيانات المنصة المحفوظة على جهازك: الخطوط والمشاريع.",
      },
      { property: "og:title", content: "الإعدادات — منصة الأستاذ" },
      { property: "og:description", content: "الوضع الليلي وتنظيف البيانات المحفوظة على جهازك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [busy, setBusy] = useState(false);

  const clean = async () => {
    setBusy(true);
    try {
      await Promise.all([clearFonts(), clearProjects()]);
      toast.success("تم تنظيف بيانات المنصة من جهازك");
    } catch {
      toast.error("تعذر تنظيف البيانات");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-10">
      <PageHeader
        icon={<SettingsIcon className="size-6" />}
        title="الإعدادات"
        description="كل البيانات محفوظة على جهازك فقط، ويمكنك حذفها في أي وقت."
      />

      <div className="surface grid gap-3 p-5">
        <Label>المظهر</Label>
        <p className="text-sm text-muted-foreground">
          الوضع الحالي: {theme === "dark" ? "ليلي" : "نهاري"}
        </p>
        <Button variant="outline" className="w-fit" onClick={toggle}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          تبديل الوضع
        </Button>
      </div>

      <div className="surface grid gap-3 p-5">
        <Label>بيانات المنصة</Label>
        <p className="text-sm text-muted-foreground">
          يحذف الخطوط المضافة والمشاريع المحفوظة على هذا الجهاز. لا يمكن التراجع.
        </p>
        <Button variant="outline" className="w-fit text-destructive" disabled={busy} onClick={clean}>
          <Trash2 className="size-4" /> تنظيف بيانات المنصة
        </Button>
      </div>
    </div>
  );
}
