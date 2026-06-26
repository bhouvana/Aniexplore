import { useState, useCallback } from "react";

export interface ContinueWatchingItem {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  seasonNumber: number;
  episodeNumber: number;
  progress: number;
  updatedAt: string;
}

const STORAGE_KEY = "ember-realm-continue-watching";

function load(): ContinueWatchingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContinueWatchingItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: ContinueWatchingItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useContinueWatching() {
  const [items, setItems] = useState<ContinueWatchingItem[]>(load);

  const addOrUpdate = useCallback((item: ContinueWatchingItem) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.tmdbId !== item.tmdbId);
      const updated = [{ ...item, updatedAt: new Date().toISOString() }, ...filtered].slice(0, 20);
      save(updated);
      return updated;
    });
  }, []);

  const remove = useCallback((tmdbId: number) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.tmdbId !== tmdbId);
      save(updated);
      return updated;
    });
  }, []);

  return { items, addOrUpdate, remove };
}
