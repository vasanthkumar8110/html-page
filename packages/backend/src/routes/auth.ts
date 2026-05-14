import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import * as authService from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request, reply) => {
    const { email, password } = registerSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(400).send({ message: 'User already exists' });
    }

    const passwordHash = await authService.hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    return reply.status(201).send({ id: user.id, email: user.email });
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await authService.verifyPassword(password, user.passwordHash))) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const session = await authService.createSession(
      user.id,
      request.headers['user-agent'],
      request.ip
    );

    const accessToken = fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken: session.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  });

  // Refresh
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(request.body);

    const session = await authService.refreshSession(refreshToken);
    if (!session) {
      return reply.status(401).send({ message: 'Invalid or expired refresh token' });
    }

    const accessToken = fastify.jwt.sign({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return {
      accessToken,
      refreshToken: session.refreshToken,
    };
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(request.body);
    await authService.revokeSession(refreshToken);
    return { message: 'Logged out successfully' };
  });
}
