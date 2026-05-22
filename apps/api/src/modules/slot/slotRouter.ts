import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorise } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  generateSlotsSchema,
  blockSlotSchema,
  walkInSchema,
  getBarberSlotsSchema,
} from './slotValidation.js';
import { generateSlots } from './slotGenerator.js';
import * as slotService from './slotService.js';

export const slotRouter = Router();

// POST /salons/:salonId/slots/generate — Generate slots (OWNER/BARBER)
slotRouter.post(
  '/salons/:salonId/slots/generate',
  authenticate,
  authorise('OWNER', 'BARBER', 'ADMIN'),
  validate(generateSlotsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await generateSlots(req.params.salonId as string, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /slots/:id/block — Block a slot (OWNER/BARBER)
slotRouter.post(
  '/slots/:id/block',
  authenticate,
  authorise('OWNER', 'BARBER', 'ADMIN'),
  validate(blockSlotSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slot = await slotService.blockSlot(req.params.id as string, req.user!.id);
      res.json({ success: true, data: slot });
    } catch (error) {
      next(error);
    }
  }
);

// POST /slots/:id/unblock — Unblock a slot (OWNER/BARBER)
slotRouter.post(
  '/slots/:id/unblock',
  authenticate,
  authorise('OWNER', 'BARBER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slot = await slotService.unblockSlot(req.params.id as string, req.user!.id);
      res.json({ success: true, data: slot });
    } catch (error) {
      next(error);
    }
  }
);

// POST /slots/:id/walkin — Add walk-in to slot (OWNER/BARBER)
slotRouter.post(
  '/slots/:id/walkin',
  authenticate,
  authorise('OWNER', 'BARBER', 'ADMIN'),
  validate(walkInSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const walkIn = await slotService.addWalkIn(req.params.id as string, req.user!.id, req.body);
      res.status(201).json({ success: true, data: walkIn });
    } catch (error) {
      next(error);
    }
  }
);

// GET /barbers/:barberId/slots — Get barber's slots for a date
slotRouter.get(
  '/barbers/:barberId/slots',
  validate(getBarberSlotsSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slots = await slotService.getBarberSlots(
        req.params.barberId as string,
        req.query as never
      );
      res.json({ success: true, data: slots });
    } catch (error) {
      next(error);
    }
  }
);
