import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import AnimeCard from "@/components/anime/AnimeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  useGetTrendingAnime,
  useGetPopularAnime,
  useGetTopRatedAnime,
  useGetSeasonalAnime,
  useSearchAnime,
  useGetAnimeGenres,
  getGetTrendingAnimeQueryKey,
  getGetPopularAnimeQueryKey,
  getGetTopRatedAnimeQueryKey,
  getGetSeasonalAnimeQueryKey,
  getSearchAnimeQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

type FilterMode = "trending" | "popular" | "top-rated" | "seasonal";

export default function AnimeBrowse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterMode>("trending");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useGetAnimeGenres();

  const trending = useGetTrendingAnime(undefined, {
    query: {
      enabled: !debouncedQuery && activeFilter === "trending",
      queryKey: getGetTrendingAnimeQueryKey(),
    },
  });
  const popular = useGetPopularAnime(undefined, {
    query: {
      enabled: !debouncedQuery && activeFilter === "popular",
      queryKey: getGetPopularAnimeQueryKey(),
    },
  });
  const topRated = useGetTopRatedAnime(undefined, {
    query: {
      enabled: !debouncedQuery && activeFilter === "top-rated",
      queryKey: getGetTopRatedAnimeQueryKey(),
    },
  });
  const seasonal = useGetSeasonalAnime(undefined, {
    query: {
      enabled: !debouncedQuery && activeFilter === "seasonal",
      queryKey: getGetSeasonalAnimeQueryKey(),
    },
  });
  const searchParams = debouncedQuery ? { q: debouncedQuery } : { q: "" };
  const searchResults = useSearchAnime(searchParams, {
    query: {
      enabled: !!debouncedQuery,
      queryKey: getSearchAnimeQueryKey(searchParams),
    },
  });

  const filterModes: { key: FilterMode; label: string }[] = [
    { key: "trending", label: "Trending" },
    { key: "popular", label: "Popular" },
    { key: "top-rated", label: "Top Rated" },
    { key: "seasonal", label: "Airing Now" },
  ];

  const activeData = debouncedQuery
    ? searchResults.data?.results
    : activeFilter === "trending"
    ? trending.data?.results
    : activeFilter === "popular"
    ? popular.data?.results
    : activeFilter === "top-rated"
    ? topRated.data?.results
    : seasonal.data?.results;

  const isLoading = debouncedQuery
    ? searchResults.isLoading
    : activeFilter === "trending"
    ? trending.isLoading
    : activeFilter === "popular"
    ? popular.isLoading
    : activeFilter === "top-rated"
    ? topRated.isLoading
    : seasonal.isLoading;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 md:px-6 py-4">
        <div className="flex items-center gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="anime-search-input"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <SlidersHorizontal size={20} className="text-muted-foreground" />
        </div>

        {!debouncedQuery && (
          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {filterModes.map(({ key, label }) => (
              <button
                key={key}
                data-testid={`filter-${key}`}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200",
                  activeFilter === key
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 py-6">
        {debouncedQuery && (
          <p className="text-muted-foreground text-sm mb-4">
            Results for <span className="text-foreground font-semibold">"{debouncedQuery}"</span>
            {searchResults.data && (
              <span className="ml-2 text-muted-foreground">
                ({searchResults.data.totalResults} found)
              </span>
            )}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
          {isLoading
            ? Array.from({ length: 20 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 mt-2 rounded" />
                </div>
              ))
            : activeData?.map((item) => (
                <AnimeCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  voteAverage={item.voteAverage}
                  firstAirDate={item.firstAirDate}
                />
              ))}
        </div>

        {!isLoading && (!activeData || activeData.length === 0) && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl font-semibold mb-2">No results found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
