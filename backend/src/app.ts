import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
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

  // Security / transport
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

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
