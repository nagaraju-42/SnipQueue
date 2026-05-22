import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorise } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createSalonSchema, updateSalonSchema, searchSalonSchema } from './salonValidation.js';
import * as salonService from './salonService.js';

export const salonRouter = Router();

// POST /salons — Create salon (OWNER only)
salonRouter.post(
  '/',
  authenticate,
  authorise('OWNER', 'ADMIN'),
  validate(createSalonSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salon = await salonService.createSalon(req.user!.id, req.body);
      res.status(201).json({ success: true, data: salon });
    } catch (error) {
      next(error);
    }
  }
);

// GET /salons/search — Search salons (public)
salonRouter.get(
  '/search',
  validate(searchSalonSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await salonService.searchSalons(req.query as never);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /salons/:id — Get salon by ID (public)
salonRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salon = await salonService.getSalonById(req.params.id as string);
      res.json({ success: true, data: salon });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /salons/:id — Update salon (OWNER only)
salonRouter.put(
  '/:id',
  authenticate,
  authorise('OWNER', 'ADMIN'),
  validate(updateSalonSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salon = await salonService.updateSalon(req.params.id as string, req.user!.id, req.body);
      res.json({ success: true, data: salon });
    } catch (error) {
      next(error);
    }
  }
);
