import type { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string) { return new ApiError(400, message, "BAD_REQUEST"); }
  static notFound(message: string) { return new ApiError(404, message, "NOT_FOUND"); }
  static tooManyRequests(message: string) { return new ApiError(429, message, "RATE_LIMITED"); }
  static internal(message = "Internal server error") { return new ApiError(500, message, "INTERNAL_ERROR"); }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found`, code: "NOT_FOUND" });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  // Log unexpected errors
  if (req.log) {
    req.log.error({ err }, "Unhandled error");
  }

  const isDev = process.env.NODE_ENV !== "production";
  const message = isDev && err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message, code: "INTERNAL_ERROR" });
}
