import { Router } from "express";
import { withCache, TTL } from "../lib/cache";

const router = Router();

// ─── MangaDex ──────────────────────────────────────────────────────────────

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
    headers: { "User-Agent": "Aniexplore/1.0 (anime-manga-reader)" },
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

type MDListResponse = { data: MDManga[]; total: number; limit: number; offset: number };

type MDChapter = {
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
};

function mapMDManga(m: MDManga) {
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
    source: "mangadex" as const,
  };
}

function mapMDChapter(c: MDChapter) {
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
    externalUrl: c.attributes.externalUrl,
    isExternal: !!c.attributes.externalUrl,
  };
}

const ALL_CONTENT_RATINGS = ["safe", "suggestive", "erotica", "pornographic"];

const MD_BASE_PARAMS = {
  "includes[]": ["cover_art"],
  "contentRating[]": ALL_CONTENT_RATINGS,
};

// ─── AniList ────────────────────────────────────────────────────────────────

const ANILIST_BASE = "https://graphql.anilist.co";
const AL_PREFIX = "al-";

const isAL = (id: string) => id.startsWith(AL_PREFIX);
const alNumId = (id: string) => parseInt(id.slice(AL_PREFIX.length), 10);

type ALMedia = {
  id: number;
  title: { english: string | null; romaji: string };
  coverImage: { extraLarge: string | null; large: string | null };
  description: string | null;
  averageScore: number | null;
  status: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
  chapters: number | null;
  genres: string[];
  startDate: { year: number | null };
  staff?: {
    edges: {
      role: string;
      node: { name: { full: string } };
    }[];
  };
  synonyms?: string[];
};

async function alFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}: ${res.statusText}`);
  const json = await res.json() as { data: T; errors?: unknown[] };
  if (json.errors?.length) {
    throw new Error(`AniList GraphQL error: ${JSON.stringify(json.errors[0])}`);
  }
  return json.data;
}

function alStatus(s: ALMedia["status"]): string {
  switch (s) {
    case "FINISHED": return "completed";
    case "RELEASING": return "ongoing";
    case "NOT_YET_RELEASED": return "upcoming";
    case "CANCELLED": return "cancelled";
    case "HIATUS": return "hiatus";
    default: return "ongoing";
  }
}

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim() || null;
}

function mapALManga(m: ALMedia) {
  return {
    id: `${AL_PREFIX}${m.id}`,
    title: m.title.english ?? m.title.romaji,
    description: stripHtml(m.description),
    coverUrl: m.coverImage.extraLarge ?? m.coverImage.large ?? null,
    status: alStatus(m.status),
    year: m.startDate.year,
    tags: m.genres,
    rating: m.averageScore != null ? m.averageScore / 10 : null,
    lastChapter: m.chapters != null ? String(m.chapters) : null,
    lastUpdated: null as string | null,
    source: "anilist" as const,
  };
}

const AL_FIELDS = `
  id
  title { english romaji }
  coverImage { extraLarge large }
  description(asHtml: false)
  averageScore
  status
  chapters
  genres
  startDate { year }
`;

const AL_POPULAR_QUERY = `
  query PopularManga($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) { ${AL_FIELDS} }
    }
  }
`;

const AL_TRENDING_QUERY = `
  query TrendingManga($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, sort: TRENDING_DESC, isAdult: false) { ${AL_FIELDS} }
    }
  }
`;

const AL_SEARCH_QUERY = `
  query SearchManga($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, search: $search, isAdult: false, sort: SEARCH_MATCH) { ${AL_FIELDS} }
    }
  }
`;

const AL_DETAIL_QUERY = `
  query MangaDetail($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      title { english romaji }
      coverImage { extraLarge large }
      description(asHtml: false)
      averageScore
      status
      chapters
      genres
      startDate { year }
      synonyms
      staff(sort: RELEVANCE, perPage: 10) {
        edges {
          role
          node { name { full } }
        }
      }
    }
  }
`;

// ─── Shared helpers ─────────────────────────────────────────────────────────

function normaliseTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dedup<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((m) => {
    const key = normaliseTitle(m.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Search MangaDex by title, returns the best-match UUID or null. */
async function resolveToMDId(title: string): Promise<string | null> {
  try {
    const data = await mdFetch<MDListResponse>("/manga", {
      title,
      limit: 5,
      "order[followedCount]": "desc",
      ...MD_BASE_PARAMS,
    });
    return data.data[0]?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.get("/popular", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Number(req.query["offset"] ?? 0);
  const page = Math.floor(offset / limit) + 1;

  try {
    const results = await withCache(`manga:popular:${limit}:${offset}`, TTL.MANGA_LIST, async () => {
      const [mdResult, alResult] = await Promise.allSettled([
        mdFetch<MDListResponse>("/manga", {
          limit,
          offset,
          "order[followedCount]": "desc",
          ...MD_BASE_PARAMS,
        }).then((d) => d.data.map(mapMDManga)),

        alFetch<{ Page: { media: ALMedia[] } }>(AL_POPULAR_QUERY, {
          page,
          perPage: Math.ceil(limit / 2),
        }).then((d) => d.Page.media.map(mapALManga)),
      ]);

      const md = mdResult.status === "fulfilled" ? mdResult.value : [];
      const al = alResult.status === "fulfilled" ? alResult.value : [];

      if (mdResult.status === "rejected") console.error("[popular] MangaDex failed:", mdResult.reason);
      if (alResult.status === "rejected") console.error("[popular] AniList failed:", alResult.reason);

      return dedup([...md, ...al]);
    });
    res.json({ results, total: results.length, limit, offset });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch popular manga");
    res.status(502).json({ error: "Failed to fetch popular manga" });
  }
});

router.get("/latest", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Number(req.query["offset"] ?? 0);
  const page = Math.floor(offset / limit) + 1;

  try {
    const results = await withCache(`manga:latest:${limit}:${offset}`, TTL.MANGA_LIST, async () => {
      const [mdResult, alResult] = await Promise.allSettled([
        mdFetch<MDListResponse>("/manga", {
          limit,
          offset,
          "order[updatedAt]": "desc",
          ...MD_BASE_PARAMS,
        }).then((d) => d.data.map(mapMDManga)),

        alFetch<{ Page: { media: ALMedia[] } }>(AL_TRENDING_QUERY, {
          page,
          perPage: Math.ceil(limit / 2),
        }).then((d) => d.Page.media.map(mapALManga)),
      ]);

      const md = mdResult.status === "fulfilled" ? mdResult.value : [];
      const al = alResult.status === "fulfilled" ? alResult.value : [];

      if (mdResult.status === "rejected") console.error("[latest] MangaDex failed:", mdResult.reason);
      if (alResult.status === "rejected") console.error("[latest] AniList failed:", alResult.reason);

      return dedup([...md, ...al]);
    });
    res.json({ results, total: results.length, limit, offset });
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
    const results = await withCache(`manga:search:${q}:${limit}:${offset}`, TTL.SEARCH, async () => {
      const [mdResult, alResult] = await Promise.allSettled([
        mdFetch<MDListResponse>("/manga", {
          title: q, limit, offset, ...MD_BASE_PARAMS,
        }).then((d) => d.data.map(mapMDManga)),

        alFetch<{ Page: { media: ALMedia[] } }>(AL_SEARCH_QUERY, {
          search: q, page: 1, perPage: Math.ceil(limit / 2),
        }).then((d) => d.Page.media.map(mapALManga)),
      ]);

      const md = mdResult.status === "fulfilled" ? mdResult.value : [];
      const al = alResult.status === "fulfilled" ? alResult.value : [];

      return dedup([...md, ...al]);
    });
    res.json({ results, total: results.length, limit, offset });
  } catch (err) {
    req.log.error({ err }, "Failed to search manga");
    res.status(502).json({ error: "Failed to search manga" });
  }
});

// ─── Chapter pages (BEFORE /:id routes) ────────────────────────────────────

router.get("/chapter/:chapterId/pages", async (req, res) => {
  const { chapterId } = req.params;
  try {
    const data = await withCache(`manga:chapter:${chapterId}:pages`, TTL.MANGA_PAGES, () =>
      mdFetch<{
        result: string;
        baseUrl: string;
        chapter: { hash: string; data: string[]; dataSaver: string[] };
      }>(`/at-home/server/${chapterId}`)
    );

    const pages = data.chapter.data.length > 0 ? data.chapter.data : data.chapter.dataSaver;

    res.json({
      chapterId,
      baseUrl: data.baseUrl,
      hash: data.chapter.hash,
      pages,
      dataSaver: data.chapter.data.length === 0,
      isAbsoluteUrls: false,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch chapter pages");
    res.status(502).json({ error: "Failed to fetch chapter pages" });
  }
});

// ─── Chapters for a manga (BEFORE /:id) ────────────────────────────────────

router.get("/:id/chapters", async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query["limit"] ?? 100), 500);
  const offset = Number(req.query["offset"] ?? 0);

  // ── AniList manga: resolve title → MangaDex UUID → English chapters ──
  if (isAL(id)) {
    const numId = alNumId(id);
    try {
      // Step 1: Get AniList title (cached 1h)
      const media = await withCache(`al:${numId}:details`, TTL.MANGA_DETAIL, () =>
        alFetch<{ Media: ALMedia }>(AL_DETAIL_QUERY, { id: numId }).then((d) => d.Media)
      );
      const title = media.title.english ?? media.title.romaji;

      // Step 2: Resolve to MangaDex ID by title search (cached 1h)
      const mdId = await withCache(`al:${numId}:mdid`, TTL.MANGA_DETAIL, () =>
        resolveToMDId(title)
      );

      if (!mdId) {
        res.json({ chapters: [], total: 0, limit, offset });
        return;
      }

      // Step 3: Fetch English chapters from MangaDex (cached 15min)
      const data = await withCache(`manga:${mdId}:chapters:${limit}:${offset}`, TTL.MANGA_CHAPTERS, () =>
        mdFetch<{ data: MDChapter[]; total: number; limit: number; offset: number }>("/chapter", {
          manga: mdId,
          limit,
          offset,
          "order[chapter]": "desc",
          "includes[]": ["scanlation_group"],
          "contentRating[]": ALL_CONTENT_RATINGS,
        })
      );

      res.json({
        chapters: data.data.map(mapMDChapter),
        total: data.total,
        limit: data.limit,
        offset: data.offset,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to fetch AniList manga chapters");
      res.status(502).json({ error: "Failed to fetch chapters" });
    }
    return;
  }

  // ── MangaDex chapters — English only ─────────────────────────────────
  try {
    const data = await withCache(`manga:${id}:chapters:${limit}:${offset}`, TTL.MANGA_CHAPTERS, () =>
      mdFetch<{ data: MDChapter[]; total: number; limit: number; offset: number }>("/chapter", {
        manga: id,
        "translatedLanguage[]": ["en"],
        limit,
        offset,
        "order[chapter]": "desc",
        "includes[]": ["scanlation_group"],
        "contentRating[]": ALL_CONTENT_RATINGS,
      })
    );

    res.json({
      chapters: data.data.map(mapMDChapter),
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch chapters");
    res.status(502).json({ error: "Failed to fetch chapters" });
  }
});

// ─── Manga details — LAST ───────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // ── AniList manga details ─────────────────────────────────────────────
  if (isAL(id)) {
    const numId = alNumId(id);
    try {
      const media = await withCache(`al:${numId}:details`, TTL.MANGA_DETAIL, () =>
        alFetch<{ Media: ALMedia }>(AL_DETAIL_QUERY, { id: numId }).then((d) => d.Media)
      );

      const title = media.title.english ?? media.title.romaji;
      const authors = media.staff?.edges
        .filter((e) => /story|original creator|original story/i.test(e.role))
        .map((e) => e.node.name.full) ?? [];
      const artists = media.staff?.edges
        .filter((e) => /art|character design|illustration/i.test(e.role))
        .map((e) => e.node.name.full) ?? [];
      const altTitles = [
        ...(media.title.english && media.title.romaji !== media.title.english
          ? [media.title.romaji]
          : []),
        ...(media.synonyms?.slice(0, 3) ?? []),
      ];

      res.json({
        id,
        title,
        altTitles,
        description: stripHtml(media.description),
        coverUrl: media.coverImage.extraLarge ?? media.coverImage.large ?? null,
        status: alStatus(media.status),
        year: media.startDate.year,
        tags: media.genres,
        authors,
        artists,
        rating: media.averageScore != null ? media.averageScore / 10 : null,
        totalChapters: media.chapters ?? null,
        lastUpdated: null,
        source: "anilist",
      });
    } catch (err) {
      req.log.error({ err }, "Failed to fetch AniList manga details");
      res.status(502).json({ error: "Failed to fetch manga details" });
    }
    return;
  }

  // ── MangaDex manga details ────────────────────────────────────────────
  try {
    const data = await withCache(`manga:${id}:details`, TTL.MANGA_DETAIL, () =>
      mdFetch<{ data: MDManga }>(`/manga/${id}`, {
        "includes[]": ["cover_art", "author", "artist"],
      })
    );
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
      source: "mangadex",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch manga details");
    res.status(502).json({ error: "Failed to fetch manga details" });
  }
});

export default router;
