import crypto from 'crypto';
import { redis } from '../../lib/redis.js';
import { logger } from '../../config/logger.js';

const OTP_TTL_SECONDS = 300; // 5 minutes
const MAX_ATTEMPTS = 3;

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate and store OTP in Redis with 5-minute TTL.
 * Key format: otp:{purpose}:{email}
 * Stores JSON with otp value and attempt count.
 */
export async function createOtp(email: string, purpose: 'verify' | 'reset' = 'verify'): Promise<string> {
  const otp = generateOtp();
  const key = `otp:${purpose}:${email}`;

  await redis.setex(
    key,
    OTP_TTL_SECONDS,
    JSON.stringify({ otp, attempts: 0 })
  );

  logger.debug({ email, purpose }, 'OTP created');
  return otp;
}

/**
 * Verify OTP from Redis. Max 3 attempts, then OTP is invalidated.
 * Returns true if OTP matches, false otherwise.
 */
export async function verifyOtp(
  email: string,
  inputOtp: string,
  purpose: 'verify' | 'reset' = 'verify'
): Promise<boolean> {
  const key = `otp:${purpose}:${email}`;
  const stored = await redis.get(key);

  if (!stored) {
    logger.warn({ email, purpose }, 'OTP not found or expired');
    return false;
  }

  const data = JSON.parse(stored) as { otp: string; attempts: number };

  // Check max attempts
  if (data.attempts >= MAX_ATTEMPTS) {
    await redis.del(key);
    logger.warn({ email, purpose }, 'OTP max attempts exceeded');
    return false;
  }

  if (data.otp !== inputOtp) {
    // Increment attempt count
    data.attempts += 1;
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      await redis.setex(key, ttl, JSON.stringify(data));
    }
    logger.warn({ email, purpose, attempts: data.attempts }, 'Invalid OTP attempt');
    return false;
  }

  // OTP is valid — delete it (one-time use)
  await redis.del(key);
  logger.info({ email, purpose }, 'OTP verified successfully');
  return true;
}
