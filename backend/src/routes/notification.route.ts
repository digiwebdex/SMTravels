import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import * as notifications from "../services/notification.service";

// My notifications — ANY authenticated user, always scoped to the session's
// own userId (the customer portal keeps its own customer-gated endpoints).
export const notificationRouter = Router();

notificationRouter.get(
  "/notifications",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await notifications.listMine(req.auth!) });
  }),
);
notificationRouter.post(
  "/notifications/read-all",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await notifications.markAllMineRead(req.auth!));
  }),
);
