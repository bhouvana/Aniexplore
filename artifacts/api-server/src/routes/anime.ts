import { Router } from "express";

const router = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";

// Genre 16 = Animation, Japanese-original language — tight anime filter
const ANIME_PARAMS = {
  with_genres: "16",
  with_original_language: "ja",
};

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

function mapTVItem(item: Record<string, unknown>) {
  return {
    id: item["id"],
    title: (item["name"] as string) ?? (item["title"] as string) ?? "Unknown",
    name: item["name"],
    posterPath: item["poster_path"],
    backdropPath: item["backdrop_path"],
    overview: item["overview"],
    voteAverage: item["vote_average"],
    voteCount: item["vote_count"],
    firstAirDate: item["first_air_date"],
    releaseDate: item["release_date"],
    mediaType: item["media_type"] ?? "tv",
    genreIds: item["genre_ids"] ?? [],
  };
}

function mapListResponse(data: {
  results: Record<string, unknown>[];
  page: number;
  total_pages: number;
  total_results: number;
}) {
  return {
    results: data.results.map(mapTVItem),
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

// GET /anime/genres
router.get("/genres", async (req, res) => {
  try {
    const data = await tmdbFetch<{ genres: { id: number; name: string }[] }>(
      "/genre/tv/list",
      { language: "en-US" }
    );
    res.json({ genres: data.genres });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch genres");
    res.status(502).json({ error: "Failed to fetch genres" });
  }
});

// GET /anime/trending — uses discover sorted by popularity (trending supports no genre filter)
router.get("/trending", async (req, res) => {
  const page = Number(req.query["page"] ?? 1);
  try {
    const data = await tmdbFetch<{
      results: Record<string, unknown>[];
      page: number;
      total_pages: number;
      total_results: number;
    }>("/discover/tv", {
      page,
      ...ANIME_PARAMS,
      sort_by: "popularity.desc",
    });
    res.json(mapListResponse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch trending");
    res.status(502).json({ error: "Failed to fetch trending" });
  }
});

// GET /anime/popular
router.get("/popular", async (req, res) => {
  const page = Number(req.query["page"] ?? 1);
  try {
    const data = await tmdbFetch<{
      results: Record<string, unknown>[];
      page: number;
      total_pages: number;
      total_results: number;
    }>("/discover/tv", {
      page,
      ...ANIME_PARAMS,
      sort_by: "popularity.desc",
      "vote_count.gte": 50,
    });
    res.json(mapListResponse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch popular");
    res.status(502).json({ error: "Failed to fetch popular" });
  }
});

// GET /anime/top-rated
router.get("/top-rated", async (req, res) => {
  const page = Number(req.query["page"] ?? 1);
  try {
    const data = await tmdbFetch<{
      results: Record<string, unknown>[];
      page: number;
      total_pages: number;
      total_results: number;
    }>("/discover/tv", {
      page,
      ...ANIME_PARAMS,
      sort_by: "vote_average.desc",
      "vote_count.gte": 200,
    });
    res.json(mapListResponse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch top-rated");
    res.status(502).json({ error: "Failed to fetch top-rated" });
  }
});

// GET /anime/seasonal — currently airing Japanese animation
router.get("/seasonal", async (req, res) => {
  const page = Number(req.query["page"] ?? 1);
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 4);
  const airDateGte = monthAgo.toISOString().split("T")[0];

  try {
    const data = await tmdbFetch<{
      results: Record<string, unknown>[];
      page: number;
      total_pages: number;
      total_results: number;
    }>("/discover/tv", {
      page,
      ...ANIME_PARAMS,
      sort_by: "popularity.desc",
      "first_air_date.gte": airDateGte,
    });
    res.json(mapListResponse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch seasonal");
    res.status(502).json({ error: "Failed to fetch seasonal" });
  }
});

// GET /anime/search
router.get("/search", async (req, res) => {
  const q = String(req.query["q"] ?? "");
  const page = Number(req.query["page"] ?? 1);
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }
  try {
    const data = await tmdbFetch<{
      results: Record<string, unknown>[];
      page: number;
      total_pages: number;
      total_results: number;
    }>("/search/tv", { query: q, page });
    // Filter to animation or Japanese originals when possible
    const filtered = data.results.filter((r) => {
      const genres = (r["genre_ids"] as number[]) ?? [];
      const lang = r["original_language"] as string;
      return genres.includes(16) || lang === "ja";
    });
    res.json({
      ...mapListResponse(data),
      results: filtered.map(mapTVItem),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to search");
    res.status(502).json({ error: "Failed to search" });
  }
});

// Sub-routes BEFORE /:id
router.get("/:id/recommendations", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const data = await tmdbFetch<{
      results: Record<string, unknown>[];
      page: number;
      total_pages: number;
      total_results: number;
    }>(`/tv/${id}/recommendations`);
    res.json(mapListResponse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch recommendations");
    res.status(502).json({ error: "Failed to fetch recommendations" });
  }
});

router.get("/:id/videos", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const data = await tmdbFetch<{
      results: { id: string; name: string; key: string; site: string; type: string; official: boolean }[];
    }>(`/tv/${id}/videos`, { language: "en-US" });
    res.json({ results: data.results });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch videos");
    res.status(502).json({ error: "Failed to fetch videos" });
  }
});

router.get("/:id/seasons/:seasonNumber/episodes", async (req, res) => {
  const id = Number(req.params["id"]);
  const seasonNumber = Number(req.params["seasonNumber"]);
  if (isNaN(id) || isNaN(seasonNumber)) {
    res.status(400).json({ error: "Invalid params" }); return;
  }
  try {
    const data = await tmdbFetch<{
      name: string;
      season_number: number;
      episodes: Record<string, unknown>[];
    }>(`/tv/${id}/season/${seasonNumber}`);
    res.json({
      name: data.name,
      seasonNumber: data.season_number,
      episodes: (data.episodes ?? []).map((e) => ({
        id: e["id"],
        name: e["name"],
        episodeNumber: e["episode_number"],
        seasonNumber: e["season_number"],
        overview: e["overview"],
        airDate: e["air_date"],
        stillPath: e["still_path"],
        voteAverage: e["vote_average"],
        runtime: e["runtime"],
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch episodes");
    res.status(502).json({ error: "Failed to fetch episodes" });
  }
});

router.get("/:id/embed/:season/:episode", async (req, res) => {
  const id = Number(req.params["id"]);
  const season = Number(req.params["season"]);
  const episode = Number(req.params["episode"]);
  if (isNaN(id) || isNaN(season) || isNaN(episode)) {
    res.status(400).json({ error: "Invalid params" }); return;
  }
  const embedUrl = `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
  res.json({ embedUrl, type: "iframe", tmdbId: id, season, episode });
});

// GET /anime/:id — LAST
router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [details, credits] = await Promise.all([
      tmdbFetch<Record<string, unknown>>(`/tv/${id}`, { append_to_response: "recommendations" }),
      tmdbFetch<{ cast: Record<string, unknown>[] }>(`/tv/${id}/credits`),
    ]);
    const rawRecommendations = (
      (details["recommendations"] as { results: Record<string, unknown>[] }) ?? { results: [] }
    ).results;

    res.json({
      id: details["id"],
      name: (details["name"] as string) ?? "",
      originalName: details["original_name"],
      posterPath: details["poster_path"],
      backdropPath: details["backdrop_path"],
      overview: details["overview"],
      voteAverage: details["vote_average"],
      voteCount: details["vote_count"],
      firstAirDate: details["first_air_date"],
      lastAirDate: details["last_air_date"],
      status: details["status"],
      numberOfSeasons: details["number_of_seasons"],
      numberOfEpisodes: details["number_of_episodes"],
      genres: (details["genres"] as { id: number; name: string }[]) ?? [],
      seasons: ((details["seasons"] as Record<string, unknown>[]) ?? []).map((s) => ({
        id: s["id"],
        name: s["name"],
        seasonNumber: s["season_number"],
        episodeCount: s["episode_count"],
        airDate: s["air_date"],
        overview: s["overview"],
        posterPath: s["poster_path"],
      })),
      cast: ((credits.cast ?? []) as Record<string, unknown>[]).slice(0, 20).map((c) => ({
        id: c["id"],
        name: c["name"],
        character: c["character"],
        profilePath: c["profile_path"],
      })),
      networks: ((details["networks"] as { id: number; name: string }[]) ?? []).map((n) => ({
        id: n.id,
        name: n.name,
      })),
      recommendations: rawRecommendations.slice(0, 12).map(mapTVItem),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch anime details");
    res.status(502).json({ error: "Failed to fetch anime details" });
  }
});

export default router;
