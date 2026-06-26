import { Link } from "wouter";
import { Play, X } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";
import { useContinueWatching } from "@/hooks/useContinueWatching";

export default function ContinueWatchingRow() {
  const { items, remove } = useContinueWatching();

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 px-4 md:px-6">
        Continue Watching
      </h2>
      <div
        className="flex gap-4 overflow-x-auto px-4 md:px-6 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <div
            key={item.tmdbId}
            data-testid={`continue-watching-${item.tmdbId}`}
            className="group relative flex-shrink-0 w-48 md:w-56"
          >
            <Link href={`/watch/${item.tmdbId}/${item.seasonNumber}/${item.episodeNumber}`}>
              <div className="relative rounded-xl overflow-hidden cursor-pointer aspect-video bg-card">
                {item.posterPath ? (
                  <img
                    src={posterUrl(item.posterPath, "w300")}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-card" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                    <Play size={18} className="fill-white text-white ml-0.5" />
                  </div>
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30"
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(item.progress ?? 0) * 100}%` }}
                  />
                </div>
              </div>
            </Link>
            <div className="mt-2 pr-6">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                S{item.seasonNumber} E{item.episodeNumber}
              </p>
            </div>
            <button
              data-testid={`remove-continue-watching-${item.tmdbId}`}
              onClick={() => remove(item.tmdbId)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
