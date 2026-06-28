import type { Request, Response, NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Force HTTPS in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  // Disable client-side caching for API responses
  res.setHeader("Cache-Control", "no-store");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Remove the Express fingerprint header
  res.removeHeader("X-Powered-By");

  next();
}
