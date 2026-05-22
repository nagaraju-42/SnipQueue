import rateLimit from 'express-rate-limit';

/**
 * General rate limiter — 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMITED',
  },
});

/**
 * Auth rate limiter — 5 requests per minute per IP.
 * Applied to login, register, OTP, and password reset endpoints.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMITED',
  },
});
