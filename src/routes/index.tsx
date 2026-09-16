import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  ImageDown,
  Newspaper,
  PenTool,
  Settings,
  ShieldCheck,
  Wand2,
  Zap,
} from "lucide-react";

import { AdSlot } from "../components/AdSlot";
import { PrivacyNote } from "../components/PrivacyNote";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة الأستاذ — أدوات المدرس تعمل على جهازك" },
      {
        name: "description",
        content:
          "ضغط الصور، إنشاء الشهادات، وشهادات جماعية من ملف Excel — كل شيء داخل المتصفح بدون رفع أي ملف.",
      },
      { property: "og:title", content: "منصة الأستاذ" },
      {
        property: "og:description",
        content: "أدواتك التعليمية، مباشرة على جهازك: صور، شهادات، Excel، خطوط.",
      },
    ],
  }),
  component: Home,
});

const TOOLS = [
  {
    to: "/tools/image-compressor",
    icon: ImageDown,
    title: "ضغط الصور",
    desc: "ضغط وتحويل الصور بدون رفعها.",
  },
  {
    to: "/tools/certificates",
    icon: GraduationCap,
    title: "إنشاء الشهادات",
    desc: "أنشئ شهادة لطالب واحد.",
  },
  {
    to: "/tools/excel-certificates",
    icon: FileSpreadsheet,
    title: "شهادات جماعية",
    desc: "اكتب الأسماء أو ارفع Excel: تقديرية أو درجات.",
  },
  {
    to: "/tools/certificates",
    icon: Award,
    title: "شهادة تقديرية",
    desc: "ضع اسم الطالب على قالب جاهز.",
  },
  {
    to: "/tools/exam-builder",
    icon: Wand2,
    title: "تنضيد الأسئلة",
    desc: "ورقة أسئلة A4 مع رموز المواد وتصدير PDF/PNG.",
  },
  { to: "/tools/fonts", icon: PenTool, title: "الخطوط", desc: "أضف خطوطك الخاصة." },
  { to: "/tools/pdf", icon: FileText, title: "أدوات PDF", desc: "قريباً." },
  { to: "/articles", icon: Newspaper, title: "المقالات", desc: "مقالات وإرشادات للمدرسين." },
  { to: "/settings", icon: Settings, title: "الإعدادات", desc: "الوضع الليلي وتنظيف البيانات." },
] as const;

const FEATURES = [
  { icon: ShieldCheck, title: "خصوصية كاملة", desc: "الملفات لا تخرج من جهازك أبداً." },
  { icon: Zap, title: "سرعة فورية", desc: "لا انتظار للرفع أو التحميل من خادم." },
  { icon: GraduationCap, title: "صُنع للمدرسين", desc: "أدوات مصممة لاحتياجاتك اليومية في المدرسة." },
];

function Home() {
  return (
    <>
      <section className="gradient-hero border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 text-center sm:py-24">
          <PrivacyNote className="mx-auto" />
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">منصة الأستاذ</h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            أدواتك التعليمية، مباشرة على جهازك. أدوات مجانية تحافظ على خصوصية ملفاتك وبيانات طلابك.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/tools/excel-certificates"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-6 font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
            >
              ابدأ بشهادات Excel
            </Link>
            <Link
              to="/tools/image-compressor"
              className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-6 font-medium transition-colors hover:bg-secondary"
            >
              ضغط الصور
            </Link>
          </div>
        </div>
      </section>

      <AdSlot placement="home" className="pt-8" />

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold sm:text-2xl">الأدوات</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.title}
              to={tool.to}
              className="surface group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <tool.icon className="size-5" />
              </span>
              <span className="grid gap-1">
                <span className="font-display font-bold">{tool.title}</span>
                <span className="text-sm text-muted-foreground">{tool.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="surface grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="grid gap-2">
              <f.icon className="size-6 text-accent" />
              <h3 className="font-display font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
