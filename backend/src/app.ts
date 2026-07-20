import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { requestId } from "./middleware/requestId";
import { apiRateLimiter } from "./middleware/rateLimit";
import { apiRouter } from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

/** Build the Express app (middleware -> routes -> error handling). */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // sits behind nginx

  // Security / transport.
  // Credentialed CORS: echo the request Origin only if it is on the allow-list
  // (prod SPA origin + local dev). Never "*", which the spec forbids and which
  // browsers reject together with credentials anyway.
  const allowedOrigins = new Set(
    [env.CORS_ORIGIN, "http://localhost:5173", "http://localhost:4173"].filter(Boolean),
  );
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Non-browser callers (curl, server-to-server) send no Origin — allow them.
        if (!origin || allowedOrigins.has(origin)) return cb(null, true);
        return cb(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(compression());

  // Body / cookie parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Correlation id + structured request logging
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as unknown as { id: string }).id,
    }),
  );

  // API (rate-limited)
  app.use("/api", apiRateLimiter, apiRouter);

  // 404 + centralized error handler (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
