import { Link, useRouterState } from "@tanstack/react-router";
import { GraduationCap, Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AdSlot } from "../AdSlot";
import { Button } from "../ui/button";
import { useTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/tools/image-compressor", label: "ضغط الصور" },
  { to: "/tools/exam-builder", label: "تنضيد الأسئلة" },
  { to: "/tools/certificates", label: "الشهادات" },
  { to: "/tools/excel-certificates", label: "شهادات جماعية" },
  { to: "/tools/fonts", label: "الخطوط" },
  { to: "/articles", label: "المقالات" },
  { to: "/settings", label: "الإعدادات" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-lg font-bold">منصة الأستاذ</span>
          </Link>

          <nav className="mr-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  path === item.to && "bg-secondary text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mr-auto flex items-center gap-1 lg:mr-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="تبديل الوضع الليلي"
              title="الوضع الليلي / النهاري"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="القائمة"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <nav className="grid gap-1 border-t border-border bg-background px-4 py-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground",
                  path === item.to && "bg-secondary text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        {path.startsWith("/tools") && <AdSlot placement="tools" className="pt-4" />}
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-8 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            ملفاتك لا يتم رفعها إلى أي خادم. تتم معالجة الملفات مباشرة على جهازك.
          </p>
          <p>منصة الأستاذ — أدوات مجانية للمدرسين، تعمل بدون حساب.</p>
        </div>
      </footer>
    </div>
  );
}
