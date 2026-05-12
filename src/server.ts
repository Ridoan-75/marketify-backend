import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { env } from './config/index';
import { prisma } from './lib/prisma';
import { redis } from './config/redis';

const server = http.createServer(app);

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('Database connected');

    await redis.connect();
    console.log('Redis connected');

    server.listen(env.PORT, () => {
      console.log(`Marketify server running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Health: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  });
});

startServer();