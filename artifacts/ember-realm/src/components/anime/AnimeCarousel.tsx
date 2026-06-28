import { useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import AnimeCard from "./AnimeCard";
import { Skeleton } from "@/components/ui/skeleton";

interface AnimeItem {
  id: number;
  title: string;
  posterPath?: string | null;
  voteAverage?: number | null;
  firstAirDate?: string | null;
}

interface AnimeCarouselProps {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  items?: AnimeItem[];
  isLoading?: boolean;
  accent?: "primary" | "secondary";
}

export default function AnimeCarousel({
  title,
  subtitle,
  seeAllHref = "/anime",
  items,
  isLoading,
}: AnimeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -640 : 640, behavior: "smooth" });
  };

  return (
    <section className="mb-12 animate-slide-up">
      <div className="flex items-start justify-between mb-4 px-4 md:px-6">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4 mt-0.5">
          <Link href={seeAllHref}>
            <span className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
              See all
              <ArrowRight size={14} />
            </span>
          </Link>
          <div className="flex gap-1.5 ml-2">
            <button
              data-testid={`carousel-prev-${title}`}
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/25 transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              data-testid={`carousel-next-${title}`}
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/25 transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth px-4 md:px-6 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36 md:w-44">
                <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 mt-2 rounded" />
                <Skeleton className="h-3 w-1/2 mt-1 rounded" />
              </div>
            ))
          : items?.map((item) => (
              <AnimeCard
                key={item.id}
                id={item.id}
                title={item.title}
                posterPath={item.posterPath}
                voteAverage={item.voteAverage}
                firstAirDate={item.firstAirDate}
              />
            ))}
      </div>
    </section>
  );
}
