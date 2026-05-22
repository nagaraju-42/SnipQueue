import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSocketServer } from './socket/socketServer';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

const httpServer = createServer(app);

// Initialize Socket.io
initSocketServer(httpServer);

const PORT = env.PORT || 4000;

async function startServer() {
  try {
    // Check connections before starting
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    await redis.ping();
    logger.info('Redis connected successfully');

    httpServer.listen(PORT, () => {
      logger.info(`🚀 SnipQ API Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  httpServer.close(() => {
    logger.info('HTTP server closed.');
  });
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully.');
  httpServer.close(() => {
    logger.info('HTTP server closed.');
  });
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

startServer();
