import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';

import { authRouter } from './modules/auth/authRouter';
import { salonRouter } from './modules/salon/salonRouter';
import { barberRouter } from './modules/barber/barberRouter';
import { serviceRouter } from './modules/service/serviceRouter';
import { slotRouter } from './modules/slot/slotRouter';
import { bookingRouter } from './modules/booking/bookingRouter';
import { paymentRouter } from './modules/payment/paymentRouter';
import { queueRouter } from './modules/queue/queueRouter';
import { ratingRouter } from './modules/rating/ratingRouter';
import { ownerRouter } from './modules/owner/ownerRouter';
import { healthRouter } from './routes/health';

const app = express();

// 1. Webhook route must use raw body before express.json()
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), paymentRouter);

// 2. Standard middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// 3. Logging & Rate Limiting
app.use(pinoHttp({ logger }));
app.use('/api/', generalLimiter); // Apply to all /api routes

// 4. Mount Routes
app.use('/', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/salons', salonRouter);
app.use('/api/v1/barbers', barberRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/slots', slotRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/queue', queueRouter);
app.use('/api/v1/ratings', ratingRouter);
app.use('/api/v1/owner', ownerRouter);

// 5. Global Error Handler (Must be last)
app.use(errorHandler);

export default app;
