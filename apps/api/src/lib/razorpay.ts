import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export async function createRazorpayOrder(
  amount: number, // in paise
  receipt: string,
  notes?: Record<string, string>
): Promise<{ id: string; amount: number; currency: string }> {
  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: notes || {},
    });
    logger.info({ orderId: order.id, amount, receipt }, 'Razorpay order created');
    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    };
  } catch (error) {
    logger.error({ error, amount, receipt }, 'Failed to create Razorpay order');
    throw error;
  }
}

export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}
