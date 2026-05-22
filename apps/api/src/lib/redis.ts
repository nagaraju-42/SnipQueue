import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const redis = new Redis(env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  tls: {
    rejectUnauthorized: false,
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, '❌ Redis connection error');
});

// Helper to create a duplicate connection for pub/sub
export function createRedisClient(): Redis {
  return new Redis(env.UPSTASH_REDIS_URL, {
    maxRetriesPerRequest: 3,
    tls: {
      rejectUnauthorized: false,
    },
  });
}
