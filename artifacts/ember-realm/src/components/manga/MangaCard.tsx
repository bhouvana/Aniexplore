import { Link } from "wouter";
import { Star, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface MangaCardProps {
  id: string;
  title: string;
  coverUrl?: string | null;
  rating?: number | null;
  status?: string | null;
  lastChapter?: string | null;
  className?: string;
}

export default function MangaCard({ id, title, coverUrl, rating, status, lastChapter, className }: MangaCardProps) {
  return (
    <Link href={`/manga/${id}`}>
      <div
        data-testid={`card-manga-${id}`}
        className={cn(
          "group relative flex-shrink-0 w-36 md:w-44 cursor-pointer animate-fade-in",
          className
        )}
      >
        <div className="relative aspect-[2/3] bg-card overflow-hidden rounded-xl ring-1 ring-white/5 group-hover:ring-white/20 transition-all duration-300 group-hover:shadow-2xl">
          {coverUrl ? (
            <img
              src={coverUrl}
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

          {/* Read icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="w-11 h-11 rounded-full bg-amber-400/12 backdrop-blur-sm border border-amber-400/35 flex items-center justify-center">
              <BookOpen size={15} className="text-amber-100" />
            </div>
          </div>

          {/* Rating badge — top left */}
          {rating != null && rating > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/75 backdrop-blur-sm rounded-full px-2 py-0.5">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-bold">{rating.toFixed(2)}</span>
            </div>
          )}

          {/* Status badge — top right */}
          {status && (
            <div
              className={cn(
                "absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold",
                status === "ongoing"
                  ? "bg-secondary/25 text-secondary border border-secondary/30"
                  : "bg-black/50 text-white/60 border border-white/10"
              )}
            >
              {status}
            </div>
          )}
        </div>

        <div className="mt-2 px-0.5">
          <p className="text-sm font-medium text-foreground/90 line-clamp-2 leading-tight group-hover:text-white transition-colors">
            {title}
          </p>
          {lastChapter && (
            <p className="text-xs text-muted-foreground mt-0.5">Ch. {lastChapter}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
