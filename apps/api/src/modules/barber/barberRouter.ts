import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorise } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { addBarberSchema, updateBarberSchema } from './barberValidation.js';
import * as barberService from './barberService.js';

export const barberRouter = Router();

// POST /salons/:salonId/barbers — Add barber (OWNER only)
barberRouter.post(
  '/salons/:salonId/barbers',
  authenticate,
  authorise('OWNER', 'ADMIN'),
  validate(addBarberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barber = await barberService.addBarber(
        req.params.salonId as string,
        req.user!.id,
        req.body
      );
      res.status(201).json({ success: true, data: barber });
    } catch (error) {
      next(error);
    }
  }
);

// GET /salons/:salonId/barbers — List barbers by salon (public)
barberRouter.get(
  '/salons/:salonId/barbers',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barbers = await barberService.listBarbersBySalon(req.params.salonId as string);
      res.json({ success: true, data: barbers });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /barbers/:id — Update barber (OWNER only)
barberRouter.put(
  '/barbers/:id',
  authenticate,
  authorise('OWNER', 'ADMIN'),
  validate(updateBarberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barber = await barberService.updateBarber(
        req.params.id as string,
        req.user!.id,
        req.body
      );
      res.json({ success: true, data: barber });
    } catch (error) {
      next(error);
    }
  }
);
