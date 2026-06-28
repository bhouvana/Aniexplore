import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import MangaCard from "@/components/manga/MangaCard";
import MangaCarousel from "@/components/manga/MangaCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  useGetPopularManga,
  useGetLatestManga,
  useSearchManga,
  getSearchMangaQueryKey,
} from "@workspace/api-client-react";

export default function MangaBrowse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const popular = useGetPopularManga();
  const latest = useGetLatestManga();
  const searchParams = debouncedQuery ? { q: debouncedQuery } : { q: "" };
  const searchResults = useSearchManga(searchParams, {
    query: {
      enabled: !!debouncedQuery,
      queryKey: getSearchMangaQueryKey(searchParams),
    },
  });

  const showSearch = !!debouncedQuery;

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-40 glass px-4 md:px-6 py-4">
        <div className="flex items-center gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="manga-search-input"
              placeholder="Search manga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {showSearch ? (
        <div className="px-4 md:px-6 py-6">
          <p className="text-muted-foreground text-sm mb-4">
            Results for{" "}
            <span className="text-foreground font-semibold">"{debouncedQuery}"</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            {searchResults.isLoading
              ? Array.from({ length: 20 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4 mt-2 rounded" />
                  </div>
                ))
              : searchResults.data?.results.map((item) => (
                  <MangaCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    coverUrl={item.coverUrl}
                    rating={item.rating}
                    status={item.status}
                    lastChapter={item.lastChapter}
                  />
                ))}
          </div>
        </div>
      ) : (
        <div className="py-6">
          <div className="px-4 md:px-6 mb-8">
            <div className="rounded-2xl bg-gradient-to-r from-secondary/20 to-primary/10 border border-white/10 p-6">
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-1">Manga</h1>
              <p className="text-muted-foreground text-sm">
                Discover thousands of manga titles from MangaDex & AniList — all in English
              </p>
            </div>
          </div>

          <MangaCarousel
            title="Most Popular"
            items={popular.data?.results}
            isLoading={popular.isLoading}
          />

          <MangaCarousel
            title="Latest Updates"
            items={latest.data?.results}
            isLoading={latest.isLoading}
          />

          <div className="px-4 md:px-6 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Popular Titles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {popular.isLoading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                      <Skeleton className="h-4 w-3/4 mt-2 rounded" />
                    </div>
                  ))
                : popular.data?.results.map((item) => (
                    <MangaCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      coverUrl={item.coverUrl}
                      rating={item.rating}
                      status={item.status}
                      lastChapter={item.lastChapter}
                    />
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}