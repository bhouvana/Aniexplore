import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Evict old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [key, entry] of store) {
    if (entry.windowStart < cutoff) store.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = "Too many requests, please try again later." } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
      store.set(ip, { count: 1, windowStart: now });
      next();
      return;
    }

    entry.count++;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: message, retryAfter });
      return;
    }

    next();
  };
}
