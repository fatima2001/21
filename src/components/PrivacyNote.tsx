import { Lock } from "lucide-react";

export function PrivacyNote({ className = "" }: { className?: string }) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground ${className}`}
    >
      <Lock className="size-3.5 text-primary" />
      معالجة محلية — لا يتم رفع ملفاتك إلى أي خادم
    </p>
  );
}

export function PageHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
      <PrivacyNote className="w-fit" />
    </div>
  );
}
