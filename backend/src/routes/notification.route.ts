import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { OutboundChannel, OutboundStatus } from "@prisma/client";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireAnyPermission } from "../middleware/auth";
import * as notifications from "../services/notification.service";
import {
  listOutbound,
  outboundDashboard,
  retryOutbound,
  enqueueNotification,
} from "../services/unifiedNotification.service";

export const notificationRouter = Router();
const viewComms = requireAnyPermission(["crm", "settings"], "view");
const manageComms = requireAnyPermission(["crm", "settings"], "manage");

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

notificationRouter.get(
  "/notifications/outbound",
  requireAuth,
  viewComms,
  asyncHandler(async (req: Request, res: Response) => {
    const q = z
      .object({
        status: z.nativeEnum(OutboundStatus).optional(),
        channel: z.nativeEnum(OutboundChannel).optional(),
        event: z.string().optional(),
        page: z.coerce.number().int().positive().optional(),
        pageSize: z.coerce.number().int().positive().optional(),
      })
      .parse(req.query);
    res.json(await listOutbound(q));
  }),
);

notificationRouter.get(
  "/notifications/dashboard",
  requireAuth,
  viewComms,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await outboundDashboard());
  }),
);

notificationRouter.post(
  "/notifications/outbound/:id/retry",
  requireAuth,
  manageComms,
  asyncHandler(async (req: Request, res: Response) => {
    await retryOutbound(String(req.params.id));
    res.json({ success: true, message: "Retry queued" });
  }),
);

const enqueueSchema = z.object({
  event: z.string().min(1),
  channels: z.array(z.enum(["EMAIL", "SMS", "WHATSAPP", "IN_APP"])).min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(6).optional().nullable(),
  userId: z.string().optional().nullable(),
  name: z.string().optional(),
  vars: z.record(z.string()).optional(),
  scheduleAt: z.string().datetime().optional(),
});

notificationRouter.post(
  "/notifications/outbound",
  requireAuth,
  manageComms,
  asyncHandler(async (req: Request, res: Response) => {
    const input = enqueueSchema.parse(req.body);
    const ids = await enqueueNotification(
      input.event,
      input.channels,
      {
        email: input.email,
        phone: input.phone,
        userId: input.userId,
        name: input.name,
      },
      input.vars ?? {},
      { scheduleAt: input.scheduleAt ? new Date(input.scheduleAt) : undefined },
    );
    res.status(201).json({ ids });
  }),
);
