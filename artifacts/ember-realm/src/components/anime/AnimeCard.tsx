import { Link } from "wouter";
import { Star, Play } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

interface AnimeCardProps {
  id: number;
  title: string;
  posterPath?: string | null;
  voteAverage?: number | null;
  firstAirDate?: string | null;
  className?: string;
}

export default function AnimeCard({ id, title, posterPath, voteAverage, firstAirDate, className }: AnimeCardProps) {
  const year = firstAirDate ? new Date(firstAirDate).getFullYear() : null;

  return (
    <Link href={`/anime/${id}`}>
      <div
        data-testid={`card-anime-${id}`}
        className={cn(
          "group relative flex-shrink-0 w-36 md:w-44 cursor-pointer animate-fade-in",
          className
        )}
      >
        <div className="relative aspect-[2/3] bg-card overflow-hidden rounded-xl ring-1 ring-white/5 group-hover:ring-white/20 transition-all duration-300 group-hover:shadow-2xl">
          {posterPath ? (
            <img
              src={posterUrl(posterPath, "w300")}
              alt={title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card text-muted-foreground">
              <span className="text-4xl">?</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="w-11 h-11 rounded-full bg-amber-400/12 backdrop-blur-sm border border-amber-400/35 flex items-center justify-center">
              <Play size={16} className="fill-amber-100 text-amber-100 ml-0.5" />
            </div>
          </div>

          {/* Rating badge — top left */}
          {voteAverage != null && voteAverage > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/75 backdrop-blur-sm rounded-full px-2 py-0.5">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-bold">{voteAverage.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="mt-2 px-0.5">
          <p className="text-sm font-medium text-foreground/90 line-clamp-2 leading-tight group-hover:text-white transition-colors">
            {title}
          </p>
          {year && <p className="text-xs text-muted-foreground mt-0.5">{year}</p>}
        </div>
      </div>
    </Link>
  );
}
