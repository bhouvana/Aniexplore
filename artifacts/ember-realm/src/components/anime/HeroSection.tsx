import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Play, Info, Star } from "lucide-react";
import { backdropUrl, posterUrl } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface HeroItem {
  id: number;
  title: string;
  backdropPath?: string | null;
  posterPath?: string | null;
  overview?: string | null;
  voteAverage?: number | null;
  firstAirDate?: string | null;
}

interface HeroSectionProps {
  items?: HeroItem[];
  isLoading?: boolean;
}

export default function HeroSection({ items, isLoading }: HeroSectionProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % Math.min(items.length, 5));
    }, 6000);
    return () => clearInterval(timer);
  }, [items]);

  if (isLoading || !items || items.length === 0) {
    return (
      <div className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  const hero = items[activeIdx];
  if (!hero) return null;

  const year = hero.firstAirDate ? new Date(hero.firstAirDate).getFullYear() : null;

  return (
    <div className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden">
      <img
        src={backdropUrl(hero.backdropPath)}
        alt={hero.title}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        key={hero.id}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className="absolute inset-0 flex items-end md:items-center pb-12 md:pb-0">
        <div className="px-4 md:px-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            {hero.voteAverage != null && hero.voteAverage > 0 && (
              <div className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-3 py-1">
                <Star size={12} className="text-primary fill-primary" />
                <span className="text-primary text-sm font-bold">{hero.voteAverage.toFixed(1)}</span>
              </div>
            )}
            {year && (
              <span className="text-muted-foreground text-sm">{year}</span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-2xl">
            {hero.title}
          </h1>

          {hero.overview && (
            <p className="text-white/70 text-sm md:text-base line-clamp-3 mb-6 leading-relaxed">
              {hero.overview}
            </p>
          )}

          <div className="flex gap-3">
            <Link href={`/watch/${hero.id}/1/1`}>
              <Button
                data-testid="hero-play-button"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl shadow-[0_0_24px_rgba(249,115,22,0.45)] hover:shadow-[0_0_32px_rgba(249,115,22,0.6)] transition-all"
              >
                <Play size={18} className="mr-2 fill-white" />
                Play Now
              </Button>
            </Link>
            <Link href={`/anime/${hero.id}`}>
              <Button
                data-testid="hero-info-button"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-2.5 rounded-xl backdrop-blur-sm"
              >
                <Info size={18} className="mr-2" />
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 flex gap-2">
        {Array.from({ length: Math.min(items.length, 5) }).map((_, i) => (
          <button
            key={i}
            data-testid={`hero-dot-${i}`}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIdx ? "w-6 bg-primary" : "w-1.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
