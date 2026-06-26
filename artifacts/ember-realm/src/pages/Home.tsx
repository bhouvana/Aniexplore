import HeroSection from "@/components/anime/HeroSection";
import AnimeCarousel from "@/components/anime/AnimeCarousel";
import MangaCarousel from "@/components/manga/MangaCarousel";
import ContinueWatchingRow from "@/components/anime/ContinueWatchingRow";
import {
  useGetTrendingAnime,
  useGetPopularAnime,
  useGetTopRatedAnime,
  useGetSeasonalAnime,
  useGetPopularManga,
  useGetLatestManga,
} from "@workspace/api-client-react";

export default function Home() {
  const trending = useGetTrendingAnime();
  const popular = useGetPopularAnime();
  const topRated = useGetTopRatedAnime();
  const seasonal = useGetSeasonalAnime();
  const popularManga = useGetPopularManga();
  const latestManga = useGetLatestManga();

  return (
    <div>
      <HeroSection
        items={trending.data?.results}
        isLoading={trending.isLoading}
      />

      <div className="pt-6">
        <ContinueWatchingRow />

        <AnimeCarousel
          title="Trending This Week"
          items={trending.data?.results}
          isLoading={trending.isLoading}
          accent="primary"
        />

        <AnimeCarousel
          title="Popular Anime"
          items={popular.data?.results}
          isLoading={popular.isLoading}
          accent="secondary"
        />

        <AnimeCarousel
          title="Top Rated"
          items={topRated.data?.results}
          isLoading={topRated.isLoading}
          accent="primary"
        />

        <AnimeCarousel
          title="Currently Airing"
          items={seasonal.data?.results}
          isLoading={seasonal.isLoading}
          accent="secondary"
        />

        <div className="border-t border-border/50 pt-8 mt-4">
          <h2 className="text-xl md:text-2xl font-black text-secondary mb-2 px-4 md:px-6">
            Manga
          </h2>

          <MangaCarousel
            title="Popular Manga"
            items={popularManga.data?.results}
            isLoading={popularManga.isLoading}
          />

          <MangaCarousel
            title="Latest Updates"
            items={latestManga.data?.results}
            isLoading={latestManga.isLoading}
          />
        </div>

        <footer className="mt-12 pb-6 text-center text-xs text-muted-foreground px-4">
          <p>Fan project for personal/educational use only. Please support official anime and manga releases.</p>
        </footer>
      </div>
    </div>
  );
}
