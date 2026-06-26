import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, ChevronRight, ArrowLeft, List, Maximize2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useGetMangaChapterPages,
  useGetMangaChapters,
  useGetMangaDetails,
  getGetMangaChapterPagesQueryKey,
  getGetMangaChaptersQueryKey,
  getGetMangaDetailsQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export default function MangaReader() {
  const params = useParams<{ id: string; chapterId: string }>();
  const mangaId = params.id ?? "";
  const chapterId = params.chapterId ?? "";

  const [showChapterList, setShowChapterList] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const details = useGetMangaDetails(mangaId, {
    query: { enabled: !!mangaId, queryKey: getGetMangaDetailsQueryKey(mangaId) },
  });

  const chapters = useGetMangaChapters(mangaId, {
    query: { enabled: !!mangaId, queryKey: getGetMangaChaptersQueryKey(mangaId) },
  });

  const pages = useGetMangaChapterPages(chapterId, {
    query: { enabled: !!chapterId, queryKey: getGetMangaChapterPagesQueryKey(chapterId) },
  });

  const currentChapterIndex = chapters.data?.chapters.findIndex((c) => c.id === chapterId) ?? -1;
  const prevChapter = currentChapterIndex !== -1 && currentChapterIndex < (chapters.data?.chapters.length ?? 0) - 1
    ? chapters.data?.chapters[currentChapterIndex + 1]
    : null;
  const nextChapter = currentChapterIndex > 0
    ? chapters.data?.chapters[currentChapterIndex - 1]
    : null;

  const currentChapterData = chapters.data?.chapters.find((c) => c.id === chapterId);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" && prevChapter) {
      window.location.href = `/manga/read/${mangaId}/${prevChapter.id}`;
    } else if (e.key === "ArrowRight" && nextChapter) {
      window.location.href = `/manga/read/${mangaId}/${nextChapter.id}`;
    }
  }, [prevChapter, nextChapter, mangaId]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setLoadedImages(new Set());
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [chapterId]);

  const pageUrls = pages.data
    ? pages.data.pages.map(
        (filename) =>
          `${pages.data.baseUrl}/${pages.data.dataSaver ? "data-saver" : "data"}/${pages.data.hash}/${filename}`
      )
    : [];

  return (
    <div className="min-h-screen bg-black" ref={containerRef}>
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href={`/manga/${mangaId}`}>
            <button
              data-testid="reader-back-button"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium hidden sm:block">
                {details.data?.title ?? "Back"}
              </span>
            </button>
          </Link>

          <div className="flex-1 text-center">
            {currentChapterData && (
              <div>
                <p className="text-sm font-semibold text-white">
                  Chapter {currentChapterData.chapter ?? "?"}
                  {currentChapterData.title && (
                    <span className="text-white/60 ml-2">— {currentChapterData.title}</span>
                  )}
                </p>
                {pages.data && (
                  <p className="text-xs text-white/40">{pageUrls.length} pages</p>
                )}
              </div>
            )}
          </div>

          <button
            data-testid="chapter-list-toggle"
            onClick={() => setShowChapterList(!showChapterList)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <List size={20} />
          </button>
        </div>

        {showChapterList && (
          <div className="absolute top-full left-0 right-0 bg-black/95 border-b border-white/10 max-h-64 overflow-y-auto">
            <div className="max-w-2xl mx-auto divide-y divide-white/5">
              {chapters.data?.chapters.map((ch) => (
                <Link key={ch.id} href={`/manga/read/${mangaId}/${ch.id}`}>
                  <div
                    data-testid={`reader-chapter-${ch.id}`}
                    className={cn(
                      "px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors",
                      ch.id === chapterId ? "text-secondary" : "text-white/70"
                    )}
                    onClick={() => setShowChapterList(false)}
                  >
                    <span className="text-sm">
                      Chapter {ch.chapter ?? "?"}
                      {ch.title && <span className="text-white/40 ml-2">— {ch.title}</span>}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto py-4 px-2">
        {pages.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: "60vh" }} />
            ))}
          </div>
        ) : pageUrls.length > 0 ? (
          <div className="space-y-1">
            {pageUrls.map((url, idx) => (
              <div key={idx} className="relative bg-black/50">
                {!loadedImages.has(idx) && (
                  <Skeleton className="w-full" style={{ height: "60vh" }} />
                )}
                <img
                  src={url}
                  alt={`Page ${idx + 1}`}
                  data-testid={`page-${idx + 1}`}
                  className={cn(
                    "w-full h-auto select-none transition-opacity duration-300",
                    loadedImages.has(idx) ? "opacity-100" : "opacity-0 absolute inset-0"
                  )}
                  loading="lazy"
                  onLoad={() => setLoadedImages((prev) => new Set([...prev, idx]))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-white/40">
            <p>No pages available for this chapter</p>
          </div>
        )}

        <div className="flex justify-between items-center mt-8 px-4 py-6 border-t border-white/10">
          {prevChapter ? (
            <Link href={`/manga/read/${mangaId}/${prevChapter.id}`}>
              <Button
                data-testid="prev-chapter"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft size={16} className="mr-1" />
                Ch. {prevChapter.chapter}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <Link href={`/manga/${mangaId}`}>
            <Button variant="ghost" className="text-white/60 hover:text-white">
              Chapter List
            </Button>
          </Link>

          {nextChapter ? (
            <Link href={`/manga/read/${mangaId}/${nextChapter.id}`}>
              <Button
                data-testid="next-chapter"
                className="bg-secondary hover:bg-secondary/90 text-white"
              >
                Ch. {nextChapter.chapter}
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
