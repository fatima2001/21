import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { PageHeader } from "../../components/PrivacyNote";
import { Button } from "../../components/ui/button";

export const Route = createFileRoute("/tools/pdf")({
  head: () => ({
    meta: [
      { title: "أدوات PDF — قريباً على منصة الأستاذ" },
      {
        name: "description",
        content: "أدوات PDF المحلية قادمة قريباً: دمج وتقسيم وضغط الملفات داخل المتصفح.",
      },
      { property: "og:title", content: "أدوات PDF — منصة الأستاذ" },
      { property: "og:description", content: "قسم أدوات PDF قيد التطوير." },
    ],
  }),
  component: PdfSoon,
});

function PdfSoon() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-16">
      <PageHeader
        icon={<FileText className="size-6" />}
        title="أدوات PDF"
        description="هذا القسم قيد التطوير. سيضم دمج وتقسيم وضغط ملفات PDF، وكل المعالجة ستبقى على جهازك."
      />
      <div className="surface grid gap-4 p-6">
        <p className="text-sm text-muted-foreground">
          حتى ذلك الحين، يمكنك استخدام بقية الأدوات المتوفرة الآن.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/tools/certificates">إنشاء شهادة</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/tools/image-compressor">ضغط الصور</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
