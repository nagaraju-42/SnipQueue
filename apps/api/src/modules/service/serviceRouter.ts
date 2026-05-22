import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorise } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createServiceSchema, updateServiceSchema } from './serviceValidation.js';
import * as serviceService from './serviceService.js';

export const serviceRouter = Router();

// POST /salons/:salonId/services — Create service (OWNER only)
serviceRouter.post(
  '/salons/:salonId/services',
  authenticate,
  authorise('OWNER', 'ADMIN'),
  validate(createServiceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = await serviceService.createService(
        req.params.salonId as string,
        req.user!.id,
        req.body
      );
      res.status(201).json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  }
);

// GET /salons/:salonId/services — List services (public)
serviceRouter.get(
  '/salons/:salonId/services',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const services = await serviceService.listServicesBySalon(req.params.salonId as string);
      res.json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /services/:id — Update service (OWNER only)
serviceRouter.put(
  '/services/:id',
  authenticate,
  authorise('OWNER', 'ADMIN'),
  validate(updateServiceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = await serviceService.updateService(
        req.params.id as string,
        req.user!.id,
        req.body
      );
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /services/:id — Delete service (OWNER only)
serviceRouter.delete(
  '/services/:id',
  authenticate,
  authorise('OWNER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await serviceService.deleteService(req.params.id as string, req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);
