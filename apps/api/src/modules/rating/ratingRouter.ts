import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorise } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { submitRatingSchema, getBarberRatingsSchema } from './ratingValidation.js';
import * as ratingService from './ratingService.js';

export const ratingRouter = Router();

// POST /ratings — Submit rating (CUSTOMER only)
ratingRouter.post(
  '/',
  authenticate,
  authorise('CUSTOMER', 'ADMIN'),
  validate(submitRatingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rating = await ratingService.submitRating(req.user!.id, req.body);
      res.status(201).json({ success: true, data: rating });
    } catch (error) {
      next(error);
    }
  }
);

// GET /barbers/:barberId/ratings — Get barber ratings (public)
ratingRouter.get(
  '/barbers/:barberId/ratings',
  validate(getBarberRatingsSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ratingService.getBarberRatings(
        req.params.barberId as string,
        req.query as never
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);
