import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  listBookingsHandler,
  getBookingHandler,
  createBookingHandler,
  updateBookingHandler,
  saveDraftHandler,
  confirmBookingHandler,
  deleteBookingHandler,
} from "../controllers/booking.controller";

// All routes: requireAuth → requirePermission("bookings", …) → service applies
// branchWhere() so a non-global user only ever sees/touches their own branch.
export const bookingRouter = Router();

const view = requirePermission("bookings", "view");
const manage = requirePermission("bookings", "manage");

bookingRouter.get("/bookings", requireAuth, view, asyncHandler(listBookingsHandler));
bookingRouter.get("/bookings/:id", requireAuth, view, asyncHandler(getBookingHandler));
bookingRouter.post("/bookings", requireAuth, manage, asyncHandler(createBookingHandler));
bookingRouter.patch("/bookings/:id/draft", requireAuth, manage, asyncHandler(saveDraftHandler));
bookingRouter.post("/bookings/:id/confirm", requireAuth, manage, asyncHandler(confirmBookingHandler));
bookingRouter.patch("/bookings/:id", requireAuth, manage, asyncHandler(updateBookingHandler));
bookingRouter.delete("/bookings/:id", requireAuth, manage, asyncHandler(deleteBookingHandler));
