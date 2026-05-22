import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './authValidation.js';
import * as authService from './authService.js';

export const authRouter = Router();

// Apply auth rate limiter to all auth routes
authRouter.use(authLimiter);

// POST /auth/register
authRouter.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/verify-otp
authRouter.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyEmailOtp(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/login
authRouter.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/refresh
authRouter.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refreshAccessToken(req.body.refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/forgot-password
authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.forgotPassword(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/reset-password
authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resetPassword(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);
