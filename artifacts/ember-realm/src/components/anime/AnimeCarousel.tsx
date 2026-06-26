import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  items?: AnimeItem[];
  isLoading?: boolean;
  accent?: "primary" | "secondary";
}

export default function AnimeCarousel({ title, items, isLoading, accent = "primary" }: AnimeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 md:px-6">
        <h2
          className="text-lg md:text-xl font-bold"
          style={{ color: accent === "primary" ? "hsl(var(--primary))" : "hsl(var(--secondary))" }}
        >
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            data-testid={`carousel-prev-${title}`}
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            data-testid={`carousel-next-${title}`}
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-4 md:px-6 pb-2 scrollbar-hide"
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
