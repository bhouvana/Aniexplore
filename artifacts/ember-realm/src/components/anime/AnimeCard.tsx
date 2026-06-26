import { Link } from "wouter";
import { Star } from "lucide-react";
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
          "group relative flex-shrink-0 w-36 md:w-44 cursor-pointer overflow-hidden rounded-xl transition-transform duration-300 hover:scale-105",
          className
        )}
      >
        <div className="relative aspect-[2/3] bg-card overflow-hidden rounded-xl">
          {posterPath ? (
            <img
              src={posterUrl(posterPath, "w300")}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card text-muted-foreground">
              <span className="text-4xl">?</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{title}</p>
            {year && <p className="text-white/60 text-xs mt-0.5">{year}</p>}
          </div>

          {voteAverage != null && voteAverage > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-bold">{voteAverage.toFixed(1)}</span>
            </div>
          )}

          <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-1 ring-primary/40 transition-all duration-300" />
        </div>

        <div className="mt-2 px-0.5">
          <p className="text-sm font-medium text-foreground/90 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </p>
          {year && <p className="text-xs text-muted-foreground mt-0.5">{year}</p>}
        </div>
      </div>
    </Link>
  );
}
