import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { listAds, type Ad } from "../lib/ads.functions";
import { cn } from "../lib/utils";

export function adImageSrc(name: string) {
  return `/api/public/ad-image/${encodeURIComponent(name)}`;
}

export function AdSlot({
  placement,
  className,
}: {
  placement: "home" | "tools";
  className?: string;
}) {
  const fetchAds = useServerFn(listAds);
  const { data } = useQuery({
    queryKey: ["ads", placement],
    queryFn: () => fetchAds({ data: { placement } }),
    staleTime: 60_000,
  });

  const ads = (data ?? []) as Ad[];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % ads.length), 6000);
    return () => clearInterval(id);
  }, [ads.length]);

  if (ads.length === 0) return null;
  const ad = ads[Math.min(index, ads.length - 1)]!;

  const image = (
    <img
      src={adImageSrc(ad.image_url)}
      alt="مساحة إعلانية"
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );

  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4", className)}>
      <div className="surface overflow-hidden">
        <div className="relative aspect-[16/5] w-full bg-secondary sm:aspect-[16/4]">
          {ad.link_url ? (
            <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block h-full">
              {image}
            </a>
          ) : (
            image
          )}
        </div>
        {ads.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2">
            {ads.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`إعلان ${i + 1}`}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  i === index ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">مساحة إعلانية</p>
    </div>
  );
}
