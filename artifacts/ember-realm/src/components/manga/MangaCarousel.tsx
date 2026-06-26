import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MangaCard from "./MangaCard";
import { Skeleton } from "@/components/ui/skeleton";

interface MangaItem {
  id: string;
  title: string;
  coverUrl?: string | null;
  rating?: number | null;
  status?: string | null;
  lastChapter?: string | null;
}

interface MangaCarouselProps {
  title: string;
  items?: MangaItem[];
  isLoading?: boolean;
}

export default function MangaCarousel({ title, items, isLoading }: MangaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 md:px-6">
        <h2 className="text-lg md:text-xl font-bold text-secondary">{title}</h2>
        <div className="flex gap-2">
          <button
            data-testid={`manga-carousel-prev-${title}`}
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:border-secondary/50 hover:text-secondary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            data-testid={`manga-carousel-next-${title}`}
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:border-secondary/50 hover:text-secondary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-4 md:px-6 pb-2"
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
              <MangaCard
                key={item.id}
                id={item.id}
                title={item.title}
                coverUrl={item.coverUrl}
                rating={item.rating}
                status={item.status}
                lastChapter={item.lastChapter}
              />
            ))}
      </div>
    </section>
  );
}
