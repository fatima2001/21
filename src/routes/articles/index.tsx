import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";

import { PageHeader } from "../../components/PrivacyNote";
import { articleImageSrc } from "../../components/ArticleContent";
import { listArticles } from "../../lib/articles.functions";

const articlesQuery = queryOptions({
  queryKey: ["articles"],
  queryFn: () => listArticles(),
});

export const Route = createFileRoute("/articles/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(articlesQuery),
  head: () => ({
    meta: [
      { title: "المقالات — منصة الأستاذ" },
      {
        name: "description",
        content: "مقالات وإرشادات للمدرسين حول أدوات المنصة وإدارة الشهادات والصور.",
      },
      { property: "og:title", content: "المقالات — منصة الأستاذ" },
      { property: "og:description", content: "مقالات وإرشادات للمدرسين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const { data: articles } = useSuspenseQuery(articlesQuery);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-10">
      <PageHeader
        icon={<Newspaper className="size-6" />}
        title="المقالات"
        description="مقالات وإرشادات مختارة للمدرسين."
      />

      {articles.length === 0 ? (
        <p className="surface p-6 text-sm text-muted-foreground">لا توجد مقالات منشورة بعد.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              to="/articles/$slug"
              params={{ slug: article.slug }}
              className="surface group grid gap-3 overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              {article.cover_image && (
                <img
                  src={articleImageSrc(article.cover_image)}
                  alt={article.title}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              )}
              <span className="grid gap-2 p-5">
                <span className="font-display text-lg font-bold group-hover:text-primary">
                  {article.title}
                </span>
                {article.excerpt && (
                  <span className="text-sm text-muted-foreground">{article.excerpt}</span>
                )}
                {article.published_at && (
                  <time className="text-xs text-muted-foreground">
                    {new Date(article.published_at).toLocaleDateString("ar-IQ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
