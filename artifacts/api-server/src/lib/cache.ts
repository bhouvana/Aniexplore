interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

export const cache = new InMemoryCache();

// Sweep expired entries every 10 minutes to prevent unbounded growth
setInterval(() => cache.sweep(), 10 * 60 * 1000).unref?.();

export const TTL = {
  TRENDING: 60 * 1000,        // 1 minute
  POPULAR: 5 * 60 * 1000,     // 5 minutes
  TOP_RATED: 10 * 60 * 1000,  // 10 minutes
  SEASONAL: 5 * 60 * 1000,    // 5 minutes
  DETAILS: 60 * 60 * 1000,    // 1 hour
  EPISODES: 30 * 60 * 1000,   // 30 minutes
  VIDEOS: 60 * 60 * 1000,     // 1 hour
  RECOMMENDATIONS: 30 * 60 * 1000,
  SEARCH: 2 * 60 * 1000,      // 2 minutes
  MANGA_LIST: 5 * 60 * 1000,
  MANGA_DETAIL: 60 * 60 * 1000,
  MANGA_CHAPTERS: 15 * 60 * 1000,
  MANGA_PAGES: 60 * 60 * 1000,
};

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;
  const result = await fn();
  cache.set(key, result, ttlMs);
  return result;
}
