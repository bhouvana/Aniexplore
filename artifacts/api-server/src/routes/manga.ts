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
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "EmberRealm/1.0" },
  });
  if (!res.ok) throw new Error(`MangaDex ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

function getCoverUrl(
  mangaId: string,
  rels: { type: string; attributes?: { fileName?: string } }[]
): string | null {
  const c = rels.find((r) => r.type === "cover_art");
  if (!c?.attributes?.fileName) return null;
  return `https://uploads.mangadex.org/covers/${mangaId}/${c.attributes.fileName}.512.jpg`;
}

function getTagNames(tags: { attributes?: { name?: { en?: string } } }[]): string[] {
  return tags.map((t) => t.attributes?.name?.en).filter((n): n is string => !!n);
}

function getRelNames(
  rels: { type: string; attributes?: { name?: string } }[],
  type: string
): string[] {
  return rels
    .filter((r) => r.type === type)
    .map((r) => r.attributes?.name)
    .filter((n): n is string => !!n);
}

type MDManga = {
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
    updatedAt?: string;
  };
  relationships: { type: string; attributes?: { fileName?: string; name?: string } }[];
};

function mapManga(m: MDManga) {
  const title = m.attributes.title["en"] ?? Object.values(m.attributes.title)[0] ?? "Unknown";
  return {
    id: m.id,
    title,
    description: m.attributes.description?.["en"] ?? null,
    coverUrl: getCoverUrl(m.id, m.relationships),
    status: m.attributes.status,
    year: m.attributes.year,
    tags: getTagNames(m.attributes.tags),
    rating: m.attributes.rating?.average ?? null,
    lastChapter: m.attributes.lastChapter ?? null,
    lastUpdated: m.attributes.updatedAt ?? null,
  };
}

const MANGA_BASE_PARAMS = {
  "includes[]": ["cover_art"],
  "contentRating[]": ["safe", "suggestive"],
  "availableTranslatedLanguage[]": ["en"],
};

router.get("/popular", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Number(req.query["offset"] ?? 0);
  try {
    const data = await mdFetch<{ data: MDManga[]; total: number; limit: number; offset: number }>(
      "/manga",
      { limit, offset, "order[followedCount]": "desc", ...MANGA_BASE_PARAMS }
    );
    res.json({ results: data.data.map(mapManga), total: data.total, limit: data.limit, offset: data.offset });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch popular manga");
    res.status(502).json({ error: "Failed to fetch popular manga" });
  }
});

router.get("/latest", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Number(req.query["offset"] ?? 0);
  try {
    const data = await mdFetch<{ data: MDManga[]; total: number; limit: number; offset: number }>(
      "/manga",
      { limit, offset, "order[updatedAt]": "desc", ...MANGA_BASE_PARAMS }
    );
    res.json({ results: data.data.map(mapManga), total: data.total, limit: data.limit, offset: data.offset });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch latest manga");
    res.status(502).json({ error: "Failed to fetch latest manga" });
  }
});

router.get("/search", async (req, res) => {
  const q = String(req.query["q"] ?? "");
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Number(req.query["offset"] ?? 0);
  if (!q) { res.status(400).json({ error: "'q' is required" }); return; }
  try {
    const data = await mdFetch<{ data: MDManga[]; total: number; limit: number; offset: number }>(
      "/manga",
      { title: q, limit, offset, ...MANGA_BASE_PARAMS }
    );
    res.json({ results: data.data.map(mapManga), total: data.total, limit: data.limit, offset: data.offset });
  } catch (err) {
    req.log.error({ err }, "Failed to search manga");
    res.status(502).json({ error: "Failed to search manga" });
  }
});

// Chapter pages — BEFORE /:id
router.get("/chapter/:chapterId/pages", async (req, res) => {
  const { chapterId } = req.params;
  try {
    const data = await mdFetch<{
      result: string;
      baseUrl: string;
      chapter: { hash: string; data: string[]; dataSaver: string[] };
    }>(`/at-home/server/${chapterId}`);

    if (!data.chapter.hash || data.chapter.data.length === 0) {
      // Try data-saver as fallback
      const pages = data.chapter.dataSaver.length > 0 ? data.chapter.dataSaver : [];
      res.json({
        chapterId,
        baseUrl: data.baseUrl,
        hash: data.chapter.hash,
        pages,
        dataSaver: true,
      });
      return;
    }

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

// Chapters — BEFORE /:id
router.get("/:id/chapters", async (req, res) => {
  const { id } = req.params;
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
      // Only include chapters with hosted pages (no external links)
      "contentRating[]": ["safe", "suggestive", "erotica"],
    });

    // Filter out external chapters and chapters with 0 pages
    const hosted = data.data.filter(
      (c) => !c.attributes.externalUrl && c.attributes.pages > 0
    );

    res.json({
      chapters: hosted.map((c) => {
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
    req.log.error({ err }, "Failed to fetch chapters");
    res.status(502).json({ error: "Failed to fetch chapters" });
  }
});

// Manga details — LAST
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await mdFetch<{ data: MDManga }>(`/manga/${id}`, {
      "includes[]": ["cover_art", "author", "artist"],
    });
    const m = data.data;
    const title = m.attributes.title["en"] ?? Object.values(m.attributes.title)[0] ?? "Unknown";
    const altTitles = m.attributes.altTitles
      .flatMap((t) => Object.values(t))
      .filter((t) => t !== title)
      .slice(0, 5);

    res.json({
      id: m.id,
      title,
      altTitles,
      description: m.attributes.description?.["en"] ?? null,
      coverUrl: getCoverUrl(m.id, m.relationships),
      status: m.attributes.status,
      year: m.attributes.year,
      tags: getTagNames(m.attributes.tags),
      authors: getRelNames(m.relationships, "author"),
      artists: getRelNames(m.relationships, "artist"),
      rating: m.attributes.rating?.average ?? null,
      totalChapters: null,
      lastUpdated: m.attributes.updatedAt ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch manga details");
    res.status(502).json({ error: "Failed to fetch manga details" });
  }
});

export default router;
