import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

const healthRouter: Router = Router();

healthRouter.get('/health', async (req, res) => {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    // Check Redis
    await redis.ping();
    
    res.json({
      status: 'ok',
      db: 'ok',
      redis: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export { healthRouter };
