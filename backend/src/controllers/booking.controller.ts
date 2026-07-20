import type { Request, Response } from "express";
import {
  bookingCreateSchema,
  bookingUpdateSchema,
  bookingDraftSchema,
  bookingListQuerySchema,
} from "../contracts/booking.contract";
import * as bookings from "../services/booking.service";

export async function listBookingsHandler(req: Request, res: Response): Promise<void> {
  const query = bookingListQuerySchema.parse(req.query);
  res.json(await bookings.listBookings(req.auth!, query));
}

export async function getBookingHandler(req: Request, res: Response): Promise<void> {
  res.json(await bookings.getBooking(req.auth!, req.params.id));
}

export async function createBookingHandler(req: Request, res: Response): Promise<void> {
  const input = bookingCreateSchema.parse(req.body);
  res.status(201).json(await bookings.createBooking(req.auth!, input));
}

export async function updateBookingHandler(req: Request, res: Response): Promise<void> {
  const input = bookingUpdateSchema.parse(req.body);
  res.json(await bookings.updateBooking(req.auth!, req.params.id, input));
}

export async function saveDraftHandler(req: Request, res: Response): Promise<void> {
  const { currentStep, wizardData } = bookingDraftSchema.parse(req.body);
  res.json(await bookings.saveDraft(req.auth!, req.params.id, currentStep, wizardData));
}

export async function confirmBookingHandler(req: Request, res: Response): Promise<void> {
  res.json(await bookings.confirmBooking(req.auth!, req.params.id));
}

export async function deleteBookingHandler(req: Request, res: Response): Promise<void> {
  await bookings.deleteBooking(req.auth!, req.params.id);
  res.json({ ok: true });
}
