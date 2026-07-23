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
import { accountsRouter } from "./accounts.route";
import { invoicesRouter } from "./invoices.route";
import { reportsRouter } from "./reports.route";
import { documentRouter } from "./document.route";
import { portalRouter } from "./portal.route";
import { portalRolesRouter } from "./portal.roles.route";

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
apiRouter.use(accountsRouter);
apiRouter.use(invoicesRouter);
apiRouter.use(reportsRouter);
apiRouter.use(documentRouter);
apiRouter.use(portalRouter);
apiRouter.use(portalRolesRouter);
