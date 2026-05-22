import { Router } from 'express';
import { handleWebhook } from './webhookHandler.js';

export const paymentRouter: Router = Router();

// POST /payments/webhook — Razorpay webhook
// NOTE: express.raw() is applied in app.ts BEFORE express.json() for this route
paymentRouter.post('/webhook', handleWebhook);
