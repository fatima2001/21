import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "../lib/utils";

type Props = {
  accept: string;
  multiple?: boolean;
  title: string;
  hint?: string;
  onFiles: (files: File[]) => void;
  className?: string;
};

export function UploadZone({ accept, multiple, title, hint, onFiles, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={cn(
        "grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary/5",
        over && "border-primary bg-primary/10",
        className,
      )}
    >
      <UploadCloud className="size-8 text-primary" />
      <p className="font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
