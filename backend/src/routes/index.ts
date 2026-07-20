import { Router } from "express";
import { healthRouter } from "./health.route";
import { authRouter } from "./auth.route";
import { customerRouter } from "./customer.route";

/** Aggregate API router mounted at /api. Feature routers mount here. */
export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(customerRouter);
