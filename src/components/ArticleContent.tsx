import type { ReactNode } from "react";

export function articleImageSrc(name: string): string {
  if (/^https?:\/\//i.test(name)) return name;
  return `/api/public/article-image/${encodeURIComponent(name)}`;
}

function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return null;
}

// روابط قابلة للفتح داخل النص: [النص](https://...)
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const href = safeHref(match[2] ?? "");
    if (href) {
      nodes.push(
        <a
          key={`${keyPrefix}-a-${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
        >
          {match[1]}
        </a>,
      );
    } else {
      nodes.push(match[1] ?? "");
    }
    last = match.index + match[0].length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function ArticleContent({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);

  return (
    <div className="grid gap-5 text-base leading-relaxed">
      {blocks.map((raw, index) => {
        const block = raw.trim();
        if (!block) return null;
        const key = `b-${index}`;

        const image = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
        if (image) {
          const src = image[2] ?? "";
          return (
            <figure key={key} className="grid gap-2">
              <img
                src={articleImageSrc(src)}
                alt={image[1] || "صورة داخل المقال"}
                loading="lazy"
                className="w-full rounded-xl border border-border object-cover"
              />
              {image[1] && (
                <figcaption className="text-center text-xs text-muted-foreground">
                  {image[1]}
                </figcaption>
              )}
            </figure>
          );
        }

        if (block.startsWith("### ")) {
          return (
            <h3 key={key} className="font-display text-lg font-bold">
              {renderInline(block.slice(4), key)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={key} className="font-display text-xl font-bold sm:text-2xl">
              {renderInline(block.slice(3), key)}
            </h2>
          );
        }

        if (block.split("\n").every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={key} className="grid list-disc gap-2 pe-6">
              {block.split("\n").map((line, li) => (
                <li key={`${key}-li-${li}`}>
                  {renderInline(line.replace(/^\s*[-*]\s+/, ""), `${key}-${li}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={key} className="whitespace-pre-line text-muted-foreground">
            {renderInline(block, key)}
          </p>
        );
      })}
    </div>
  );
}
