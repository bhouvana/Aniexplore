import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { securityHeaders } from "./middleware/security-headers";
import { rateLimit } from "./middleware/rate-limit";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

const app: Express = express();

// Trust the first hop (Render's load balancer) so X-Forwarded-For is used for
// real IP-based rate limiting rather than every request appearing as one IP.
app.set("trust proxy", 1);

// Remove Express fingerprint
app.disable("x-powered-by");

// Security headers on every response
app.use(securityHeaders);

// Structured HTTP logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// CORS — allow configured origins or all origins when env var is not set
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : true;
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Body parsing with a sensible size limit
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Global rate limiting: 300 requests per 15 minutes per IP
// (enough headroom for a heavy browsing session)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests from this IP, please try again in 15 minutes.",
  }),
);

// API routes
app.use("/api", router);

// ─── Static frontend serving (production) ────────────────────────────────────
// The frontend is built to artifacts/ember-realm/dist/public. In production
// the Express server serves both the API and the React SPA from a single
// Render Web Service so no separate static host or CORS config is needed.
const frontendDistPath =
  process.env.FRONTEND_DIST_PATH ??
  path.resolve(process.cwd(), "artifacts/ember-realm/dist/public");

if (fs.existsSync(frontendDistPath)) {
  // Serve JS/CSS/images etc.
  app.use(express.static(frontendDistPath, { index: false }));

  // SPA catch-all: return index.html for every non-API path so that
  // client-side routing works on direct URL access and page refresh.
  app.get(/^(?!\/api\/).*$/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// 404 for unmatched /api routes and error handler must be last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
