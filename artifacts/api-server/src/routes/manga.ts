import { Router } from "express";

const router = Router();

const MANGADEX_BASE = "https://api.mangadex.org";

async function mdFetch<T>(
  path: string,
  params: Record<string, string | number | string[]> = {}
): Promise<T> {
  const url = new URL(`${MANGADEX_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        url.searchParams.append(k, item);
      }
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "EmberRealm/1.0" },
  });
  if (!res.ok) {
    throw new Error(`MangaDex error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

function getCoverUrl(
  mangaId: string,
  relationships: { type: string; attributes?: { fileName?: string } }[]
): string | null {
  const cover = relationships.find((r) => r.type === "cover_art");
  if (!cover?.attributes?.fileName) return null;
  return `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}.512.jpg`;
}

function getTagNames(tags: { attributes?: { name?: { en?: string } } }[]): string[] {
  return tags
    .map((t) => t.attributes?.name?.en)
    .filter((n): n is string => typeof n === "string");
}

function getRelationshipName(
  relationships: { type: string; attributes?: { name?: string } }[],
  type: string
): string[] {
  return relationships
    .filter((r) => r.type === type)
    .map((r) => r.attributes?.name)
    .filter((n): n is string => typeof n === "string");
}

type MangaDexManga = {
  id: string;
  attributes: {
    title: { en?: string; [k: string]: string | undefined };
    altTitles: { [k: string]: string }[];
    description: { en?: string; [k: string]: string | undefined };
    status: string;
    year: number | null;
    tags: { attributes?: { name?: { en?: string } } }[];
    rating?: { average?: number };
    lastChapter?: string | null;
    lastVolume?: string | null;
    updatedAt?: string;
  };
  relationships: { type: string; attributes?: { fileName?: string; name?: string } }[];
};

function mapMangaItem(manga: MangaDexManga) {
  const title =
    manga.attributes.title["en"] ??
    Object.values(manga.attributes.title)[0] ??
    "Unknown";
  return {
    id: manga.id,
    title,
    description: manga.attributes.description?.["en"] ?? null,
    coverUrl: getCoverUrl(manga.id, manga.relationships),
    status: manga.attributes.status,
    year: manga.attributes.year,
    tags: getTagNames(manga.attributes.tags),
    rating: manga.attributes.rating?.average ?? null,
    lastChapter: manga.attributes.lastChapter ?? null,
    lastUpdated: manga.attributes.updatedAt ?? null,
  };
}

// GET /manga/popular
router.get("/popular", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Number(req.query["offset"] ?? 0);
  try {
    const data = await mdFetch<{
      data: MangaDexManga[];
      total: number;
      limit: number;
      offset: number;
    }>("/manga", {
      limit,
      offset,
      "order[followedCount]": "desc",
      "includes[]": ["cover_art"],
      "contentRating[]": ["safe", "suggestive"],
      "availableTranslatedLanguage[]": ["en"],
    });
    res.json({
      results: data.data.map(mapMangaItem),
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch popular manga");
    res.status(502).json({ error: "Failed to fetch popular manga" });
  }
});

// GET /manga/latest
router.get("/latest", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Number(req.query["offset"] ?? 0);
  try {
    const data = await mdFetch<{
      data: MangaDexManga[];
      total: number;
      limit: number;
      offset: number;
    }>("/manga", {
      limit,
      offset,
      "order[updatedAt]": "desc",
      "includes[]": ["cover_art"],
      "contentRating[]": ["safe", "suggestive"],
      "availableTranslatedLanguage[]": ["en"],
    });
    res.json({
      results: data.data.map(mapMangaItem),
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch latest manga");
    res.status(502).json({ error: "Failed to fetch latest manga" });
  }
});

// GET /manga/search
router.get("/search", async (req, res) => {
  const q = String(req.query["q"] ?? "");
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Number(req.query["offset"] ?? 0);
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }
  try {
    const data = await mdFetch<{
      data: MangaDexManga[];
      total: number;
      limit: number;
      offset: number;
    }>("/manga", {
      title: q,
      limit,
      offset,
      "includes[]": ["cover_art"],
      "contentRating[]": ["safe", "suggestive"],
      "availableTranslatedLanguage[]": ["en"],
    });
    res.json({
      results: data.data.map(mapMangaItem),
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to search manga");
    res.status(502).json({ error: "Failed to search manga" });
  }
});

// GET /manga/chapter/:chapterId/pages — must come before /:id
router.get("/chapter/:chapterId/pages", async (req, res) => {
  const chapterId = req.params["chapterId"];
  try {
    const data = await mdFetch<{
      result: string;
      baseUrl: string;
      chapter: { hash: string; data: string[]; dataSaver: string[] };
    }>(`/at-home/server/${chapterId}`);
    res.json({
      chapterId,
      baseUrl: data.baseUrl,
      hash: data.chapter.hash,
      pages: data.chapter.data,
      dataSaver: false,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch chapter pages");
    res.status(502).json({ error: "Failed to fetch chapter pages" });
  }
});

// GET /manga/:id/chapters — must come before /:id
router.get("/:id/chapters", async (req, res) => {
  const id = req.params["id"];
  try {
    const data = await mdFetch<{
      data: {
        id: string;
        attributes: {
          chapter: string | null;
          title: string | null;
          volume: string | null;
          publishAt: string;
          readableAt: string;
          pages: number;
          translatedLanguage: string;
          externalUrl: string | null;
        };
        relationships: { type: string; attributes?: { name?: string } }[];
      }[];
      total: number;
    }>(`/chapter`, {
      manga: id,
      "translatedLanguage[]": ["en"],
      limit: 100,
      offset: 0,
      "order[chapter]": "desc",
      "includes[]": ["scanlation_group"],
    });

    res.json({
      chapters: data.data.map((c) => {
        const group = c.relationships.find((r) => r.type === "scanlation_group");
        return {
          id: c.id,
          chapter: c.attributes.chapter,
          title: c.attributes.title,
          volume: c.attributes.volume,
          publishAt: c.attributes.publishAt,
          readableAt: c.attributes.readableAt,
          pages: c.attributes.pages,
          translatedLanguage: c.attributes.translatedLanguage,
          scanlationGroup: group?.attributes?.name ?? null,
        };
      }),
      total: data.total,
      limit: 100,
      offset: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch manga chapters");
    res.status(502).json({ error: "Failed to fetch chapters" });
  }
});

// GET /manga/:id — must come AFTER named sub-routes
router.get("/:id", async (req, res) => {
  const id = req.params["id"];
  try {
    const data = await mdFetch<{ data: MangaDexManga }>(`/manga/${id}`, {
      "includes[]": ["cover_art", "author", "artist"],
    });
    const manga = data.data;
    const title =
      manga.attributes.title["en"] ??
      Object.values(manga.attributes.title)[0] ??
      "Unknown";

    const altTitles = manga.attributes.altTitles
      .flatMap((t) => Object.values(t))
      .filter((t) => t !== title)
      .slice(0, 5);

    res.json({
      id: manga.id,
      title,
      altTitles,
      description: manga.attributes.description?.["en"] ?? null,
      coverUrl: getCoverUrl(manga.id, manga.relationships),
      status: manga.attributes.status,
      year: manga.attributes.year,
      tags: getTagNames(manga.attributes.tags),
      authors: getRelationshipName(manga.relationships, "author"),
      artists: getRelationshipName(manga.relationships, "artist"),
      rating: manga.attributes.rating?.average ?? null,
      totalChapters: null,
      lastUpdated: manga.attributes.updatedAt ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch manga details");
    res.status(502).json({ error: "Failed to fetch manga details" });
  }
});

export default router;
