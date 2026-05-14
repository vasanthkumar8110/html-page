import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate } from '../plugins/auth.hook.js';
import { v4 as uuidv4 } from 'uuid';
import * as s3 from '../utils/s3.js';

export async function shareRoutes(fastify: FastifyInstance) {
  // Create a share link (Protected)
  fastify.post('/:fileId/share', { preHandler: [authenticate] }, async (request, reply) => {
    const { fileId } = z.object({ fileId: z.string() }).parse(request.params);
    const { expiresAt, permissions } = z.object({
      expiresAt: z.string().optional(),
      permissions: z.string().default('READ'),
    }).parse(request.body);
    const userId = request.user.sub;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) return reply.status(404).send({ message: 'File not found' });

    const token = uuidv4();
    const shareLink = await prisma.shareToken.create({
      data: {
        fileId,
        token,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        permissions,
      },
    });

    return { 
      shareToken: token,
      shareUrl: `${process.env.APP_URL}/api/v1/share/${token}` 
    };
  });

  // Access a shared file (Public)
  fastify.get('/:token', async (request, reply) => {
    const { token } = z.object({ token: z.string() }).parse(request.params);

    const share = await prisma.shareToken.findUnique({
      where: { token },
      include: { file: true },
    });

    if (!share) return reply.status(404).send({ message: 'Invalid share link' });
    if (share.expiresAt && share.expiresAt < new Date()) {
      return reply.status(410).send({ message: 'Share link expired' });
    }

    const downloadUrl = await s3.getDownloadUrl(share.file.s3Key);
    
    // For images/videos, we could return a simple HTML viewer page here
    return { 
      file: {
        name: share.file.name,
        mimeType: share.file.mimeType,
        size: share.file.size,
      },
      downloadUrl 
    };
  });
}
