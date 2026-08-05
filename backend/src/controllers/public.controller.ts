import type { Request, Response } from "express";
import { publicBookingRequestSchema, publicContactSchema } from "../contracts/public.contract";
import * as intake from "../services/publicIntake.service";
import * as paymentProof from "../services/paymentProof.service";

export async function bookingRequestHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await intake.submitBookingRequest(publicBookingRequestSchema.parse(req.body)));
}

export async function contactHandler(req: Request, res: Response): Promise<void> {
  res.status(201).json(await intake.submitContact(publicContactSchema.parse(req.body)));
}

export async function publicBankAccountsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await paymentProof.listBankAccountsPublic());
}
