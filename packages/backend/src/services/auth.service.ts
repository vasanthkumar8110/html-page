import argon2 from 'argon2';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export async function createSession(userId: string, deviceInfo?: string, ipAddress?: string) {
  const refreshToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  return await prisma.session.create({
    data: {
      userId,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt,
    },
  });
}

export async function refreshSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken: token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Generate new token (Rotating Refresh Tokens for security)
  const newRefreshToken = uuidv4();
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 30);

  return await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
    },
    include: { user: true },
  });
}

export async function revokeSession(token: string) {
  return await prisma.session.delete({
    where: { refreshToken: token },
  }).catch(() => null);
}
