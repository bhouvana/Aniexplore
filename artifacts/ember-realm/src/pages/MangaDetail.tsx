import { useParams, Link } from "wouter";
import { Star, BookOpen, Clock, User, Pen, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetMangaDetails,
  useGetMangaChapters,
  getGetMangaDetailsQueryKey,
  getGetMangaChaptersQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export default function MangaDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const details = useGetMangaDetails(id, {
    query: { enabled: !!id, queryKey: getGetMangaDetailsQueryKey(id) },
  });

  const chapters = useGetMangaChapters(id, undefined, {
    query: { enabled: !!id, queryKey: getGetMangaChaptersQueryKey(id) },
  });

  if (details.isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
    );
  }

  if (!details.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-muted-foreground">Manga not found</p>
          <Link href="/manga">
            <Button className="mt-4">Browse Manga</Button>
          </Link>
        </div>
      </div>
    );
  }

  const d = details.data;
  const hostedChapters = chapters.data?.chapters.filter((ch) => !ch.isExternal) ?? [];
  const externalChapters = chapters.data?.chapters.filter((ch) => ch.isExternal) ?? [];
  const firstChapter = hostedChapters.length > 0 ? hostedChapters[hostedChapters.length - 1] : externalChapters[externalChapters.length - 1];
  const latestChapter = hostedChapters.length > 0 ? hostedChapters[0] : externalChapters[0];

  return (
    <div className="min-h-screen">
      <div className="relative h-64 overflow-hidden">
        {d.coverUrl && (
          <img
            src={d.coverUrl}
            alt={d.title}
            className="w-full h-full object-cover blur-lg scale-110 opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="px-4 md:px-8 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            {d.coverUrl && (
              <img
                src={d.coverUrl}
                alt={d.title}
                className="w-36 md:w-48 rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            )}
          </div>

          <div className="flex-1 pt-6 md:pt-20">
            <h1 className="text-2xl md:text-4xl font-black text-white mb-2">{d.title}</h1>
            {d.altTitles && d.altTitles.length > 0 && (
              <p className="text-muted-foreground text-sm mb-3">{d.altTitles[0]}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {d.rating != null && d.rating > 0 && (
                <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-primary text-sm font-bold">{d.rating.toFixed(2)}</span>
                </div>
              )}
              {d.status && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border",
                  d.status === "ongoing"
                    ? "bg-secondary/20 border-secondary/30 text-secondary"
                    : "bg-white/5 border-white/10 text-muted-foreground"
                )}>
                  {d.status}
                </span>
              )}
              {d.year && (
                <span className="text-muted-foreground text-sm">{d.year}</span>
              )}
            </div>

            {(d.authors?.length ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <User size={14} />
                <span>{d.authors?.join(", ")}</span>
              </div>
            )}

            {(d.artists?.length ?? 0) > 0 && d.artists?.[0] !== d.authors?.[0] && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Pen size={14} />
                <span>{d.artists?.join(", ")}</span>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {firstChapter && !firstChapter.isExternal && (
                <Link href={`/manga/read/${id}/${firstChapter.id}`}>
                  <Button
                    data-testid="read-first-chapter"
                    className="bg-secondary hover:bg-secondary/90 text-white font-bold shadow-[0_0_15px_rgba(201,154,31,0.4)]"
                  >
                    <BookOpen size={16} className="mr-2" />
                    Start Reading
                  </Button>
                </Link>
              )}
              {firstChapter && firstChapter.isExternal && firstChapter.externalUrl && (
                <a href={firstChapter.externalUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-secondary hover:bg-secondary/90 text-white font-bold shadow-[0_0_15px_rgba(201,154,31,0.4)]">
                    <ExternalLink size={16} className="mr-2" />
                    Read on Official Site
                  </Button>
                </a>
              )}
              {latestChapter && latestChapter.id !== firstChapter?.id && !latestChapter.isExternal && (
                <Link href={`/manga/read/${id}/${latestChapter.id}`}>
                  <Button data-testid="read-latest-chapter" variant="outline" className="border-white/20 text-foreground">
                    <Clock size={16} className="mr-2" />
                    Latest: Ch. {latestChapter.chapter}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {d.description && (
          <div className="mt-6 mb-8 max-w-3xl">
            <h2 className="text-lg font-bold text-foreground mb-2">Synopsis</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">{d.description}</p>
          </div>
        )}

        {d.tags && d.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {d.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-white/10 text-muted-foreground text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Chapters
              {chapters.data && (
                <span className="text-muted-foreground text-sm font-normal ml-2">
                  ({chapters.data.total} total)
                </span>
              )}
            </h2>
          </div>

          {!chapters.isLoading && chapters.data?.chapters.length === 0 && (
            <div className="py-8 px-4 rounded-xl glass text-center">
              <p className="text-muted-foreground text-sm">No chapters found for this title.</p>
            </div>
          )}

          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {chapters.isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))
              : chapters.data?.chapters.map((ch) => (
                  ch.isExternal && ch.externalUrl ? (
                    <a key={ch.id} href={ch.externalUrl} target="_blank" rel="noopener noreferrer">
                      <div
                        data-testid={`chapter-${ch.id}`}
                        className="flex items-center justify-between px-4 py-3 rounded-xl glass hover:bg-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <ExternalLink size={14} className="text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            Chapter {ch.chapter ?? "?"}
                            {ch.title && <span className="font-normal text-muted-foreground ml-2">— {ch.title}</span>}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4 flex items-center gap-2">
                          {ch.publishAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(ch.publishAt).toLocaleDateString()}
                            </p>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10 text-muted-foreground">
                            External
                          </Badge>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <Link key={ch.id} href={`/manga/read/${id}/${ch.id}`}>
                      <div
                        data-testid={`chapter-${ch.id}`}
                        className="flex items-center justify-between px-4 py-3 rounded-xl glass hover:bg-white/10 transition-all cursor-pointer group"
                      >
                        <div>
                          <span className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors">
                            Chapter {ch.chapter ?? "?"}
                            {ch.title && <span className="font-normal text-muted-foreground ml-2">— {ch.title}</span>}
                          </span>
                          {ch.scanlationGroup && (
                            <p className="text-xs text-muted-foreground mt-0.5">{ch.scanlationGroup}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          {ch.publishAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(ch.publishAt).toLocaleDateString()}
                            </p>
                          )}
                          {ch.pages != null && (
                            <p className="text-xs text-muted-foreground">{ch.pages} pages</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}