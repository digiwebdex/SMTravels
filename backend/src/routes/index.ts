import { Router } from "express";
import { healthRouter } from "./health.route";
import { authRouter } from "./auth.route";
import { customerRouter } from "./customer.route";
import { bookingRouter } from "./booking.route";
import { branchRouter } from "./branch.route";
import { leadRouter } from "./lead.route";
import { corporateRouter } from "./corporate.route";
import { userRouter } from "./user.route";
import { catalogRouter } from "./catalog.route";

/** Aggregate API router mounted at /api. Feature routers mount here. */
export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(customerRouter);
apiRouter.use(bookingRouter);
apiRouter.use(branchRouter);
apiRouter.use(leadRouter);
apiRouter.use(corporateRouter);
apiRouter.use(userRouter);
apiRouter.use(catalogRouter);
