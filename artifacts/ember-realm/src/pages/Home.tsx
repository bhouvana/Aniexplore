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
      <HeroSection items={trending.data?.results} isLoading={trending.isLoading} />

      <div className="pt-8">
        <ContinueWatchingRow />

        <AnimeCarousel
          title="Trending This Week"
          subtitle="What everyone is watching right now"
          seeAllHref="/anime"
          items={trending.data?.results}
          isLoading={trending.isLoading}
        />

        <AnimeCarousel
          title="Popular Anime"
          subtitle="Fan favorites with the highest ratings"
          seeAllHref="/anime"
          items={popular.data?.results}
          isLoading={popular.isLoading}
        />

        <AnimeCarousel
          title="Top Rated"
          subtitle="Critically acclaimed titles of all time"
          seeAllHref="/anime"
          items={topRated.data?.results}
          isLoading={topRated.isLoading}
        />

        <AnimeCarousel
          title="Currently Airing"
          subtitle="New episodes dropping this season"
          seeAllHref="/anime"
          items={seasonal.data?.results}
          isLoading={seasonal.isLoading}
        />

        <div className="border-t border-white/5 pt-10 mt-2">
          <div className="px-4 md:px-6 mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-gradient leading-tight">Manga</h2>
            <p className="text-muted-foreground text-sm mt-1">Read the latest and greatest titles</p>
          </div>

          <MangaCarousel
            title="Popular Manga"
            subtitle="Top-rated titles loved by readers worldwide"
            seeAllHref="/manga"
            items={popularManga.data?.results}
            isLoading={popularManga.isLoading}
          />

          <MangaCarousel
            title="Latest Updates"
            subtitle="Fresh chapters uploaded recently"
            seeAllHref="/manga"
            items={latestManga.data?.results}
            isLoading={latestManga.isLoading}
          />
        </div>

        <footer className="mt-16 pb-10 text-center text-xs text-muted-foreground/60 px-4 border-t border-white/5 pt-8">
          <p className="font-medium mb-1">Aniexplore</p>
          <p>Fan project for personal/educational use only. Please support official anime and manga releases.</p>
        </footer>
      </div>
    </div>
  );
}
