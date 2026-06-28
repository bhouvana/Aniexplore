import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, Tv, BookOpen, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  useSearchAnime,
  useSearchManga,
  getSearchAnimeQueryKey,
  getSearchMangaQueryKey,
} from "@workspace/api-client-react";
import { posterUrl } from "@/lib/tmdb";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const animeParams = { q: debouncedQuery };
  const mangaParams = { q: debouncedQuery };

  const anime = useSearchAnime(animeParams, {
    query: { enabled: debouncedQuery.length >= 2, queryKey: getSearchAnimeQueryKey(animeParams) },
  });
  const manga = useSearchManga(mangaParams, {
    query: { enabled: debouncedQuery.length >= 2, queryKey: getSearchMangaQueryKey(mangaParams) },
  });

  const isLoading = (anime.isFetching || manga.isFetching) && debouncedQuery.length >= 2;

  const go = useCallback(
    (href: string) => {
      navigate(href);
      onClose();
    },
    [navigate, onClose]
  );

  return (
    <CommandDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <div className="flex items-center border-b border-white/10 px-3">
        <Search size={16} className="text-muted-foreground mr-2 flex-shrink-0" />
        <CommandInput
          placeholder="Search anime or manga..."
          value={query}
          onValueChange={setQuery}
          className="border-0 focus:ring-0 bg-transparent flex-1 py-4 text-sm placeholder:text-muted-foreground outline-none"
        />
        {isLoading && (
          <Loader2 size={14} className="animate-spin text-muted-foreground flex-shrink-0" />
        )}
      </div>

      <CommandList className="max-h-[60vh] overflow-y-auto">
        {debouncedQuery.length < 2 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}

        {debouncedQuery.length >= 2 && !isLoading && (
          <CommandEmpty>No results found for "{debouncedQuery}"</CommandEmpty>
        )}

        {anime.data?.results && anime.data.results.length > 0 && (
          <CommandGroup heading="Anime">
            {anime.data.results.slice(0, 5).map((item) => (
              <CommandItem
                key={item.id}
                value={`anime-${item.id}-${item.title}`}
                onSelect={() => go(`/anime/${item.id}`)}
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                <div className="w-8 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                  {item.posterPath ? (
                    <img
                      src={posterUrl(item.posterPath, "w185")}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tv size={12} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
                  {item.firstAirDate && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.firstAirDate).getFullYear()}
                    </p>
                  )}
                </div>
                <Tv size={12} className="text-muted-foreground flex-shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {manga.data?.results && manga.data.results.length > 0 && (
          <CommandGroup heading="Manga">
            {manga.data.results.slice(0, 5).map((item) => (
              <CommandItem
                key={item.id}
                value={`manga-${item.id}-${item.title}`}
                onSelect={() => go(`/manga/${item.id}`)}
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                <div className="w-8 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                  {item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={12} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
                  {item.status && (
                    <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
                  )}
                </div>
                <BookOpen size={12} className="text-muted-foreground flex-shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
