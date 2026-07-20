import { Router } from "express";
import { healthRouter } from "./health.route";

/** Aggregate API router mounted at /api. Feature routers mount here. */
export const apiRouter = Router();

apiRouter.use(healthRouter);
// e.g. apiRouter.use(bookingsRouter), apiRouter.use(authRouter), ...
