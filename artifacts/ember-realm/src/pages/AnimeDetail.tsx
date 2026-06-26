import { useState } from "react";
import { useParams, Link } from "wouter";
import { Play, Star, Calendar, Tv, ChevronDown, ChevronUp, Youtube } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AnimeCard from "@/components/anime/AnimeCard";
import { posterUrl, backdropUrl, profileUrl, stillUrl } from "@/lib/tmdb";
import {
  useGetAnimeDetails,
  useGetAnimeEpisodes,
  useGetAnimeVideos,
  getGetAnimeDetailsQueryKey,
  getGetAnimeEpisodesQueryKey,
  getGetAnimeVideosQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export default function AnimeDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [activeSeason, setActiveSeason] = useState(1);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const details = useGetAnimeDetails(id, {
    query: { enabled: !!id, queryKey: getGetAnimeDetailsQueryKey(id) },
  });

  const episodes = useGetAnimeEpisodes(id, activeSeason, {
    query: {
      enabled: !!id,
      queryKey: getGetAnimeEpisodesQueryKey(id, activeSeason),
    },
  });

  const videos = useGetAnimeVideos(id, {
    query: { enabled: !!id, queryKey: getGetAnimeVideosQueryKey(id) },
  });

  const trailer = videos.data?.results.find(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  ) ?? videos.data?.results[0];

  if (details.isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[45vh] w-full" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </div>
    );
  }

  if (!details.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-muted-foreground">Anime not found</p>
          <Link href="/anime">
            <Button className="mt-4">Browse Anime</Button>
          </Link>
        </div>
      </div>
    );
  }

  const d = details.data;
  const year = d.firstAirDate ? new Date(d.firstAirDate).getFullYear() : null;

  return (
    <div className="min-h-screen">
      <div className="relative h-[45vh] md:h-[55vh] overflow-hidden">
        {d.backdropPath && (
          <img
            src={backdropUrl(d.backdropPath)}
            alt={d.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {showTrailer && trailer && (
          <div className="absolute inset-0 z-10">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay"
              title="Trailer"
            />
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white z-20"
            >
              X
            </button>
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            {d.posterPath && (
              <img
                src={posterUrl(d.posterPath, "w300")}
                alt={d.name}
                className="w-36 md:w-48 rounded-xl shadow-2xl border border-border/50"
              />
            )}
          </div>

          <div className="flex-1 pt-6 md:pt-16">
            <h1 className="text-2xl md:text-4xl font-black text-white mb-2">{d.name}</h1>
            {d.originalName && d.originalName !== d.name && (
              <p className="text-muted-foreground text-sm mb-3">{d.originalName}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {d.voteAverage != null && d.voteAverage > 0 && (
                <div className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-3 py-1">
                  <Star size={14} className="text-primary fill-primary" />
                  <span className="text-primary text-sm font-bold">{d.voteAverage.toFixed(1)}</span>
                  {d.voteCount && <span className="text-primary/60 text-xs">({d.voteCount.toLocaleString()})</span>}
                </div>
              )}
              {year && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Calendar size={14} />
                  {year}
                </div>
              )}
              {d.status && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border",
                  d.status === "Returning Series"
                    ? "bg-secondary/20 border-secondary/30 text-secondary"
                    : "bg-muted border-border text-muted-foreground"
                )}>
                  {d.status}
                </span>
              )}
              {d.numberOfSeasons && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Tv size={14} />
                  {d.numberOfSeasons} Season{d.numberOfSeasons > 1 ? "s" : ""}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {d.genres?.map((g) => (
                <span key={g.id} className="px-3 py-1 rounded-full text-xs font-semibold bg-card border border-border text-foreground/80">
                  {g.name}
                </span>
              ))}
            </div>

            <div className="flex gap-3 mb-6">
              <Link href={`/watch/${id}/1/1`}>
                <Button
                  data-testid="detail-play-button"
                  className="bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_18px_rgba(249,115,22,0.4)]"
                >
                  <Play size={16} className="mr-2 fill-white" />
                  Watch Now
                </Button>
              </Link>
              {trailer && (
                <Button
                  data-testid="trailer-button"
                  variant="outline"
                  onClick={() => setShowTrailer(true)}
                  className="border-border hover:border-primary/50"
                >
                  <Youtube size={16} className="mr-2 text-red-500" />
                  Trailer
                </Button>
              )}
            </div>
          </div>
        </div>

        {d.overview && (
          <div className="mt-6 mb-8 max-w-3xl">
            <h2 className="text-lg font-bold text-foreground mb-2">Synopsis</h2>
            <p className={cn("text-muted-foreground leading-relaxed text-sm", !showFullOverview && "line-clamp-4")}>
              {d.overview}
            </p>
            {d.overview.length > 300 && (
              <button
                onClick={() => setShowFullOverview(!showFullOverview)}
                className="text-primary text-sm mt-2 flex items-center gap-1 hover:underline"
              >
                {showFullOverview ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Read More</>}
              </button>
            )}
          </div>
        )}

        {d.cast && d.cast.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {d.cast.slice(0, 12).map((member) => (
                <div key={member.id} className="flex-shrink-0 w-20 text-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto bg-card border border-border">
                    {member.profilePath ? (
                      <img src={profileUrl(member.profilePath)} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl">?</div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground mt-2 line-clamp-2">{member.name}</p>
                  {member.character && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{member.character}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {d.seasons && d.seasons.filter((s) => s.seasonNumber > 0).length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Episodes</h2>
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {d.seasons
                  .filter((s) => s.seasonNumber > 0)
                  .map((s) => (
                    <button
                      key={s.id}
                      data-testid={`season-tab-${s.seasonNumber}`}
                      onClick={() => setActiveSeason(s.seasonNumber)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all",
                        activeSeason === s.seasonNumber
                          ? "bg-primary/20 border-primary/50 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      S{s.seasonNumber}
                    </button>
                  ))}
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {episodes.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))
                : episodes.data?.episodes.map((ep) => (
                    <Link key={ep.id} href={`/watch/${id}/${ep.seasonNumber}/${ep.episodeNumber}`}>
                      <div
                        data-testid={`episode-${ep.episodeNumber}`}
                        className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-muted">
                          {ep.stillPath ? (
                            <img src={stillUrl(ep.stillPath)} alt={ep.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play size={16} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            <span className="text-muted-foreground mr-2">Ep {ep.episodeNumber}</span>
                            {ep.name}
                          </p>
                          {ep.overview && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ep.overview}</p>
                          )}
                        </div>
                        {ep.voteAverage != null && ep.voteAverage > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            {ep.voteAverage.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
            </div>
          </div>
        )}

        {d.recommendations && d.recommendations.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4">More Like This</h2>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {d.recommendations.map((r) => (
                <AnimeCard
                  key={r.id}
                  id={r.id}
                  title={r.title}
                  posterPath={r.posterPath}
                  voteAverage={r.voteAverage}
                  firstAirDate={r.firstAirDate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
