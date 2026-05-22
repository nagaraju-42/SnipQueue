import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorise } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  initiateBookingSchema,
  updateBookingStatusSchema,
  getMyBookingsSchema,
} from './bookingValidation.js';
import * as bookingService from './bookingService.js';

export const bookingRouter = Router();

// POST /bookings — Initiate booking (CUSTOMER only)
bookingRouter.post(
  '/',
  authenticate,
  authorise('CUSTOMER', 'ADMIN'),
  validate(initiateBookingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingService.initiateBooking(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /bookings/:id/arrive — Check-in (OWNER/BARBER)
bookingRouter.post(
  '/:id/arrive',
  authenticate,
  authorise('OWNER', 'BARBER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingService.arriveBooking(req.params.id as string, req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /bookings/:id/status — Update status (OWNER/BARBER)
bookingRouter.put(
  '/:id/status',
  authenticate,
  authorise('OWNER', 'BARBER', 'ADMIN'),
  validate(updateBookingStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingService.updateBookingStatus(
        req.params.id as string,
        req.user!.id,
        req.body
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /bookings/:id/payment-received — Mark service payment (OWNER/BARBER)
bookingRouter.put(
  '/:id/payment-received',
  authenticate,
  authorise('OWNER', 'BARBER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingService.markPaymentReceived(req.params.id as string, req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /bookings/my — Get my bookings (CUSTOMER)
bookingRouter.get(
  '/my',
  authenticate,
  validate(getMyBookingsSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bookingService.getMyBookings(req.user!.id, req.query as never);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);
