import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Play, Info, Star, Plus, Check } from "lucide-react";
import { backdropUrl } from "@/lib/tmdb";
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

function useWatchlistItem(id: number) {
  const key = `watchlist-anime-${id}`;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setSaved(localStorage.getItem(key) === "1");
    } catch {}
  }, [key]);

  const toggle = () => {
    try {
      if (saved) localStorage.removeItem(key);
      else localStorage.setItem(key, "1");
    } catch {}
    setSaved((s) => !s);
  };

  return { saved, toggle };
}

function HeroContent({ hero }: { hero: HeroItem }) {
  const year = hero.firstAirDate ? new Date(hero.firstAirDate).getFullYear() : null;
  const { saved, toggle } = useWatchlistItem(hero.id);

  return (
    <div className="px-4 md:px-10 max-w-2xl animate-slide-up">
      {/* Badges row */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/20 border border-primary/40 text-primary text-xs font-bold tracking-widest uppercase">
          Anime
        </span>
        {hero.voteAverage != null && hero.voteAverage > 0 && (
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-bold">{hero.voteAverage.toFixed(1)}</span>
          </div>
        )}
        {year && (
          <span className="text-white/50 text-sm font-medium">{year}</span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.05] mb-4 drop-shadow-2xl tracking-tight">
        {hero.title}
      </h1>

      {/* Overview */}
      {hero.overview && (
        <p className="text-white/65 text-sm md:text-base line-clamp-3 mb-7 leading-relaxed max-w-xl">
          {hero.overview}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/watch/${hero.id}/1/1`}>
          <Button
            data-testid="hero-play-button"
            className="bg-white text-black hover:bg-white/90 font-bold px-7 py-2.5 rounded-xl shadow-xl transition-all text-sm"
          >
            <Play size={16} className="mr-2 fill-black" />
            Watch Now
          </Button>
        </Link>

        <Link href={`/anime/${hero.id}`}>
          <Button
            data-testid="hero-info-button"
            variant="outline"
            className="border-white/25 bg-white/10 text-white hover:bg-white/20 font-semibold px-6 py-2.5 rounded-xl backdrop-blur-sm transition-all text-sm"
          >
            <Info size={16} className="mr-2" />
            More Info
          </Button>
        </Link>

        <button
          data-testid="hero-watchlist-button"
          onClick={toggle}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white backdrop-blur-sm transition-all text-sm font-medium"
        >
          {saved ? (
            <Check size={16} className="text-primary" />
          ) : (
            <Plus size={16} />
          )}
          <span className="hidden sm:inline">{saved ? "Saved" : "Watchlist"}</span>
        </button>
      </div>
    </div>
  );
}

export default function HeroSection({ items, isLoading }: HeroSectionProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % Math.min(items.length, 6));
    }, 6000);
    return () => clearInterval(timer);
  }, [items]);

  if (isLoading || !items || items.length === 0) {
    return (
      <div className="relative h-[70vh] md:h-[85vh] w-full overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
    );
  }

  const hero = items[activeIdx];
  if (!hero) return null;

  return (
    <div className="relative h-[70vh] md:h-[85vh] w-full overflow-hidden">
      {/* Backdrop */}
      <img
        key={hero.id}
        src={backdropUrl(hero.backdropPath)}
        alt={hero.title}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

      {/* Content — vertically centered */}
      <div className="absolute inset-0 flex items-center pb-8 md:pb-0">
        <HeroContent hero={hero} />
      </div>

      {/* Dot pagination */}
      <div className="absolute bottom-5 right-6 flex gap-1.5">
        {Array.from({ length: Math.min(items.length, 6) }).map((_, i) => (
          <button
            key={i}
            data-testid={`hero-dot-${i}`}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIdx ? "w-7 bg-primary" : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
