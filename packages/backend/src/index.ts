import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { authRoutes } from './routes/auth';
import { fileRoutes } from './routes/files';
import { shareRoutes } from './routes/share';
import { ZodError } from 'zod';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Database & Redis Clients
export const prisma = new PrismaClient();
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function bootstrap() {
  try {
    // Register Plugins
    await fastify.register(cors, {
      origin: true, // In production, replace with specific origins
    });

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'super-secret-key',
    });

    await fastify.register(multipart, {
      limits: {
        fieldNameSize: 100,
        fieldSize: 100,
        fields: 10,
        fileSize: 1000000,
        files: 1,
      },
    });

    // Error Handler
    fastify.setErrorHandler((error, request, reply) => {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      fastify.log.error(error);
      reply.status(500).send({ message: 'Internal Server Error' });
    });

    // Routes
    await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
    await fastify.register(fileRoutes, { prefix: '/api/v1/files' });
    await fastify.register(shareRoutes, { prefix: '/api/v1/share' });

    // Health Check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start Server
    const port = Number(process.env.PORT) || 3000;
    const address = await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`Server listening at ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
