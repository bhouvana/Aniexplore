import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, ChevronRight, Play, ArrowLeft, RefreshCw, ChevronDown, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { stillUrl } from "@/lib/tmdb";
import {
  useGetAnimeDetails,
  useGetAnimeEpisodes,
  useGetAnimeEmbedUrl,
  getGetAnimeDetailsQueryKey,
  getGetAnimeEpisodesQueryKey,
  getGetAnimeEmbedUrlQueryKey,
} from "@workspace/api-client-react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { toast } from "sonner";
import { useLocation } from "wouter";

const FALLBACK_TIMEOUT_MS = 5000;

export default function WatchPage() {
  const params = useParams<{ id: string; season: string; episode: string }>();
  const id = Number(params.id);
  const season = Number(params.season);
  const episode = Number(params.episode);
  const [, navigate] = useLocation();

  const { addOrUpdate } = useContinueWatching();
  const [providerIndex, setProviderIndex] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allProvidersFailed, setAllProvidersFailed] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPlayedRef = useRef(false);

  const embedInfo = useGetAnimeEmbedUrl(id, season, episode, {
    query: { enabled: !!id, queryKey: getGetAnimeEmbedUrlQueryKey(id, season, episode) },
  });

  const providers = embedInfo.data?.providers ?? [];
  const currentUrl = providers[providerIndex]?.embedUrl ?? embedInfo.data?.embedUrl;
  const isLastProvider = providerIndex >= providers.length - 1;

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const tryNextProvider = useCallback(() => {
    clearFallbackTimer();
    if (isLastProvider) {
      setIsLoading(false);
      setAllProvidersFailed(true);
      toast.error("All servers failed to load. Try a different episode.", { duration: 5000 });
      return;
    }
    setProviderIndex((i) => i + 1);
    setIsLoading(true);
    setIsSwitching(true);
    setTimeout(() => setIsSwitching(false), 700);
  }, [isLastProvider, clearFallbackTimer]);

  // Reset state when episode changes
  useEffect(() => {
    setProviderIndex(0);
    setIsLoading(true);
    setIsSwitching(false);
    setAllProvidersFailed(false);
    hasPlayedRef.current = false;
    clearFallbackTimer();
  }, [id, season, episode, clearFallbackTimer]);

  // Auto-fallback timer
  useEffect(() => {
    if (!providers.length || hasPlayedRef.current) return;
    clearFallbackTimer();
    if (!isLastProvider) {
      fallbackTimerRef.current = setTimeout(() => {
        if (!hasPlayedRef.current) tryNextProvider();
      }, FALLBACK_TIMEOUT_MS);
    }
    return () => clearFallbackTimer();
  }, [providerIndex, providers.length, isLastProvider, clearFallbackTimer, tryNextProvider]);

  // Track playback events via postMessage
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (msg?.type === "PLAYER_EVENT" && (msg.data?.event === "play" || msg.data?.event === "timeupdate")) {
          hasPlayedRef.current = true;
          setIsLoading(false);
          setAllProvidersFailed(false);
          clearFallbackTimer();
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [clearFallbackTimer]);

  const switchProvider = (idx: number) => {
    if (idx === providerIndex) return;
    clearFallbackTimer();
    hasPlayedRef.current = false;
    setAllProvidersFailed(false);
    setProviderIndex(idx);
    setIsLoading(true);
    setIsSwitching(true);
    setTimeout(() => setIsSwitching(false), 300);
  };

  const details = useGetAnimeDetails(id, {
    query: { enabled: !!id, queryKey: getGetAnimeDetailsQueryKey(id) },
  });

  const episodes = useGetAnimeEpisodes(id, season, {
    query: { enabled: !!id, queryKey: getGetAnimeEpisodesQueryKey(id, season) },
  });

  // Save to continue watching when details load
  useEffect(() => {
    if (details.data && id) {
      addOrUpdate({
        tmdbId: id,
        title: details.data.name,
        posterPath: details.data.posterPath ?? null,
        seasonNumber: season,
        episodeNumber: episode,
        progress: 0.1,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [id, season, episode, details.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentEpisodeData = episodes.data?.episodes.find(
    (e) => e.episodeNumber === episode && e.seasonNumber === season
  );

  const prevEp = episode > 1 ? episode - 1 : null;
  const nextEp = episodes.data?.episodes.find((e) => e.episodeNumber === episode + 1) ? episode + 1 : null;

  // Season list (filter out season 0 specials)
  const seasons = details.data?.seasons?.filter((s) => s.seasonNumber > 0) ?? [];
  const currentSeason = seasons.find((s) => s.seasonNumber === season);

  const switchSeason = (newSeason: number) => {
    navigate(`/watch/${id}/${newSeason}/1`);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-4">
        <Link href={`/anime/${id}`}>
          <button data-testid="watch-back-button" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium hidden sm:block">{details.data?.name ?? "Back"}</span>
          </button>
        </Link>

        {/* Season switcher */}
        {seasons.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
                {currentSeason ? currentSeason.name : `Season ${season}`}
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-[#0d0a06] border-white/10 max-h-60 overflow-y-auto">
              {seasons.map((s) => (
                <DropdownMenuItem
                  key={s.seasonNumber}
                  onClick={() => switchSeason(s.seasonNumber)}
                  className={cn(
                    "text-sm cursor-pointer",
                    s.seasonNumber === season ? "text-primary font-semibold" : "text-white/70"
                  )}
                >
                  {s.name} ({s.episodeCount} eps)
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex-1" />
        {currentEpisodeData && (
          <p className="text-sm text-white/60 hidden md:block">
            S{season} E{episode}: <span className="text-white font-semibold">{currentEpisodeData.name}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-0">
        {/* Player area */}
        <div className="flex-1">
          <div className="relative bg-black" style={{ paddingBottom: "56.25%" }}>
            {embedInfo.isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <RefreshCw size={32} className="animate-spin text-white/40 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Loading player...</p>
                </div>
              </div>
            ) : currentUrl && !allProvidersFailed ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
                    <div className="text-center">
                      <RefreshCw size={28} className="animate-spin text-white/40 mx-auto mb-2" />
                      <p className="text-white/60 text-sm">
                        {isSwitching
                          ? `Trying ${providers[providerIndex]?.name ?? "server"}...`
                          : isLastProvider
                          ? "Loading..."
                          : "Connecting..."}
                      </p>
                    </div>
                  </div>
                )}
                <iframe
                  key={`${currentUrl}-${providerIndex}`}
                  src={currentUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                  allow="fullscreen; autoplay; picture-in-picture; encrypted-media; clipboard-write; web-share"
                  title={`${details.data?.name ?? "Anime"} S${season}E${episode}`}
                  data-testid="embed-player"
                  onLoad={() => {
                    setTimeout(() => {
                      if (!hasPlayedRef.current) setIsLoading(false);
                    }, 3000);
                  }}
                />
                {/* Provider badges overlay */}
                {providers.length > 1 && (
                  <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                    {providers.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => switchProvider(idx)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                          idx === providerIndex
                            ? "bg-primary text-white shadow-lg"
                            : "bg-black/60 text-white/70 hover:bg-white/20 backdrop-blur-sm"
                        )}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center px-4">
                  <AlertCircle size={36} className="text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 font-semibold mb-1">
                    {allProvidersFailed ? "All servers failed" : "No player available"}
                  </p>
                  <p className="text-xs text-white/40 mb-4">
                    {allProvidersFailed
                      ? "Try switching the season, a different episode, or come back later."
                      : "Try a different episode."}
                  </p>
                  {allProvidersFailed && providers.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        setAllProvidersFailed(false);
                        setProviderIndex(0);
                        setIsLoading(true);
                        hasPlayedRef.current = false;
                      }}
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Episode info + controls */}
          <div className="p-4 md:p-6 max-w-4xl">
            {currentEpisodeData && (
              <div className="mb-4">
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Ep {episode}: {currentEpisodeData.name}
                </h1>
                {currentEpisodeData.overview && (
                  <p className="text-white/60 text-sm mt-2 leading-relaxed">{currentEpisodeData.overview}</p>
                )}
              </div>
            )}

            {/* Episode navigation */}
            <div className="flex gap-3 mb-6">
              {prevEp && (
                <Link href={`/watch/${id}/${season}/${prevEp}`}>
                  <Button data-testid="prev-episode" variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <ChevronLeft size={16} className="mr-1" />
                    Prev
                  </Button>
                </Link>
              )}
              {nextEp && (
                <Link href={`/watch/${id}/${season}/${nextEp}`}>
                  <Button data-testid="next-episode" size="sm" className="bg-primary hover:bg-primary/90 text-white">
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Server selector */}
            {providers.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <p className="text-xs text-white/40 w-full mb-1">Server</p>
                {providers.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => switchProvider(idx)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      idx === providerIndex
                        ? "bg-primary text-white shadow-lg"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Episode sidebar */}
        <div className="xl:w-80 border-l border-white/10 xl:h-screen xl:sticky xl:top-16 xl:overflow-y-auto">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Episodes</p>
            {seasons.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors">
                    Season {season}
                    <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0d0a06] border-white/10 max-h-48 overflow-y-auto">
                  {seasons.map((s) => (
                    <DropdownMenuItem
                      key={s.seasonNumber}
                      onClick={() => switchSeason(s.seasonNumber)}
                      className={cn(
                        "text-xs cursor-pointer",
                        s.seasonNumber === season ? "text-primary font-semibold" : "text-white/70"
                      )}
                    >
                      {s.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {episodes.isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="w-20 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))
              : episodes.data?.episodes.map((ep) => {
                  const isActive = ep.episodeNumber === episode;
                  return (
                    <Link key={ep.id} href={`/watch/${id}/${season}/${ep.episodeNumber}`}>
                      <div
                        data-testid={`sidebar-episode-${ep.episodeNumber}`}
                        className={cn(
                          "flex gap-3 p-3 cursor-pointer transition-colors",
                          isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-white/5"
                        )}
                      >
                        <div className="flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-white/5">
                          {ep.stillPath ? (
                            <img src={stillUrl(ep.stillPath)} alt={ep.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play size={14} className={isActive ? "text-primary" : "text-white/40"} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold line-clamp-2", isActive ? "text-primary" : "text-white")}>
                            <span className="text-white/40 mr-1">Ep {ep.episodeNumber}</span>
                            {ep.name}
                          </p>
                          {ep.airDate && (
                            <p className="text-xs text-white/40 mt-0.5">
                              {new Date(ep.airDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
            {episodes.isError && (
              <div className="p-4 text-center text-sm text-white/50">
                Failed to load episodes
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-white/60 w-full"
                  onClick={() => episodes.refetch()}
                >
                  <RefreshCw size={12} className="mr-1" /> Retry
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
