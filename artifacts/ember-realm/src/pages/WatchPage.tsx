import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, ChevronRight, Play, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

export default function WatchPage() {
  const params = useParams<{ id: string; season: string; episode: string }>();
  const id = Number(params.id);
  const season = Number(params.season);
  const episode = Number(params.episode);

  const { addOrUpdate } = useContinueWatching();

  const details = useGetAnimeDetails(id, {
    query: { enabled: !!id, queryKey: getGetAnimeDetailsQueryKey(id) },
  });

  const episodes = useGetAnimeEpisodes(id, season, {
    query: { enabled: !!id, queryKey: getGetAnimeEpisodesQueryKey(id, season) },
  });

  const embedInfo = useGetAnimeEmbedUrl(id, season, episode, {
    query: { enabled: !!id, queryKey: getGetAnimeEmbedUrlQueryKey(id, season, episode) },
  });

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
  }, [id, season, episode, details.data]);

  const currentEpisodeData = episodes.data?.episodes.find(
    (e) => e.episodeNumber === episode && e.seasonNumber === season
  );

  const prevEp = episode > 1 ? episode - 1 : null;
  const nextEp = episodes.data?.episodes.find((e) => e.episodeNumber === episode + 1) ? episode + 1 : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-4">
        <Link href={`/anime/${id}`}>
          <button data-testid="watch-back-button" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{details.data?.name ?? "Back"}</span>
          </button>
        </Link>
        <div className="flex-1" />
        {currentEpisodeData && (
          <p className="text-sm text-muted-foreground">
            S{season} E{episode}: <span className="text-foreground font-semibold">{currentEpisodeData.name}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-0">
        <div className="flex-1">
          <div className="relative bg-black" style={{ paddingBottom: "56.25%" }}>
            {embedInfo.isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : embedInfo.data ? (
              <iframe
                key={embedInfo.data.embedUrl}
                src={embedInfo.data.embedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                allow="fullscreen; autoplay; picture-in-picture"
                title={`${details.data?.name ?? "Anime"} S${season}E${episode}`}
                data-testid="embed-player"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Failed to load player</p>
                  <p className="text-xs text-muted-foreground">Try a different source</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 md:p-6">
            {currentEpisodeData && (
              <div className="mb-4">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  Ep {episode}: {currentEpisodeData.name}
                </h1>
                {currentEpisodeData.overview && (
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{currentEpisodeData.overview}</p>
                )}
              </div>
            )}

            <div className="flex gap-3 mb-6">
              {prevEp && (
                <Link href={`/watch/${id}/${season}/${prevEp}`}>
                  <Button data-testid="prev-episode" variant="outline" size="sm" className="border-border">
                    <ChevronLeft size={16} className="mr-1" />
                    Prev Episode
                  </Button>
                </Link>
              )}
              {nextEp && (
                <Link href={`/watch/${id}/${season}/${nextEp}`}>
                  <Button data-testid="next-episode" size="sm" className="bg-primary hover:bg-primary/90">
                    Next Episode
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="xl:w-80 border-l border-border/50 xl:h-screen xl:sticky xl:top-16 xl:overflow-y-auto">
          <div className="p-4 border-b border-border/50">
            <p className="text-sm font-semibold text-foreground">Episodes — Season {season}</p>
          </div>
          <div className="divide-y divide-border/30">
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
                          isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-card"
                        )}
                      >
                        <div className="flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-muted">
                          {ep.stillPath ? (
                            <img src={stillUrl(ep.stillPath)} alt={ep.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play size={14} className={isActive ? "text-primary" : "text-muted-foreground"} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold line-clamp-2", isActive ? "text-primary" : "text-foreground")}>
                            <span className="text-muted-foreground mr-1">Ep {ep.episodeNumber}</span>
                            {ep.name}
                          </p>
                          {ep.airDate && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(ep.airDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}
