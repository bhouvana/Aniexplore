export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null | undefined, size: "w185" | "w300" | "w500" | "w780" | "original" = "w500"): string {
  if (!path) return "/placeholder-poster.jpg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size: "w780" | "w1280" | "original" = "original"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function profileUrl(path: string | null | undefined): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/w185${path}`;
}

export function stillUrl(path: string | null | undefined): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/w300${path}`;
}
