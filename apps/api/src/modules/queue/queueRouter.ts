import { Router, Request, Response, NextFunction } from 'express';
import * as queueService from './queueService.js';

export const queueRouter = Router();

// GET /queue/:barberId — Get barber's queue (public)
queueRouter.get(
  '/:barberId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queue = await queueService.getBarberQueue(req.params.barberId as string);
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  }
);
