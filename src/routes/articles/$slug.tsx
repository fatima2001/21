import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { ArticleContent, articleImageSrc } from "../../components/ArticleContent";
import { getArticle } from "../../lib/articles.functions";

function articleQuery(slug: string) {
  return queryOptions({
    queryKey: ["article", slug],
    queryFn: async () => {
      const article = await getArticle({ data: { slug } });
      if (!article) throw notFound();
      return article;
    },
  });
}

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(articleQuery(params.slug)),
  head: ({ loaderData }) => {
    const article = loaderData;
    if (!article) {
      return { meta: [{ title: "مقال غير موجود — منصة الأستاذ" }] };
    }
    const cover =
      article.cover_image && /^https?:\/\//i.test(article.cover_image)
        ? article.cover_image
        : null;
    return {
      meta: [
        { title: `${article.title} — منصة الأستاذ` },
        {
          name: "description",
          content: (article.excerpt || article.title).slice(0, 155),
        },
        { property: "og:title", content: article.title },
        { property: "og:description", content: (article.excerpt || article.title).slice(0, 155) },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: cover ? "summary_large_image" : "summary" },
        ...(cover
          ? [
              { property: "og:image", content: cover },
              { name: "twitter:image", content: cover },
            ]
          : []),
      ],
    };
  },
  component: ArticlePage,
  notFoundComponent: () => (
    <div className="mx-auto grid w-full max-w-2xl gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">المقال غير موجود</h1>
      <Link to="/articles" className="text-primary underline underline-offset-4">
        العودة إلى المقالات
      </Link>
    </div>
  ),
});

function ArticlePage() {
  const { data: article } = useSuspenseQuery(articleQuery(Route.useParams().slug));

  return (
    <article className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10">
      <Link
        to="/articles"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        كل المقالات
      </Link>

      <header className="grid gap-3">
        <h1 className="font-display text-3xl font-bold leading-tight">{article.title}</h1>
        {article.published_at && (
          <time className="text-sm text-muted-foreground">
            {new Date(article.published_at).toLocaleDateString("ar-IQ", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
      </header>

      {article.cover_image && (
        <img
          src={articleImageSrc(article.cover_image)}
          alt={article.title}
          className="w-full rounded-2xl border border-border object-cover"
        />
      )}

      <ArticleContent content={article.content} />
    </article>
  );
}
