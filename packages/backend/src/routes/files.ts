import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../plugins/auth.hook';
import * as s3 from '../utils/s3';
import { v4 as uuidv4 } from 'uuid';

type JwtPayload = {
  sub: string;
};

function getUserIdFromRequest(request: any): string {
  const user = request.user as unknown as JwtPayload;
  return user.sub;
}

export async function fileRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // List Folders & Files
  fastify.get('/list/:folderId?', async (request, reply) => {
    const { folderId } = z.object({ folderId: z.string().optional() }).parse(request.params);
    const userId = getUserIdFromRequest(request);

    const folders = await prisma.folder.findMany({
      where: { parentId: folderId || null, userId },
    });

    const files = await prisma.file.findMany({
      where: { folderId: folderId || null, userId },
    });

    return { folders, files };
  });

  // Create Folder
  fastify.post('/folders', async (request, reply) => {
    const { name, parentId } = z.object({
      name: z.string(),
      parentId: z.string().optional(),
    }).parse(request.body);
    const userId = getUserIdFromRequest(request);

    const folder = await prisma.folder.create({
      data: { name, parentId: parentId || null, userId },
    });

    return folder;
  });

  // Request Upload URL
  fastify.post('/upload-url', async (request, reply) => {
    const { name, mimeType, size, folderId } = z.object({
      name: z.string(),
      mimeType: z.string(),
      size: z.number(),
      folderId: z.string().optional(),
    }).parse(request.body);
    const userId = getUserIdFromRequest(request);

    // Check storage quota
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.storageUsed + BigInt(size) > user.storageQuota) {
      return reply.status(400).send({ message: 'Storage quota exceeded' });
    }

    const fileId = uuidv4();
    const s3Key = `uploads/${userId}/${fileId}-${name}`;
    const uploadUrl = await s3.getUploadUrl(s3Key, mimeType);

    // Create file record with PENDING status
    const file = await prisma.file.create({
      data: {
        id: fileId,
        name,
        originalName: name,
        mimeType,
        size,
        s3Key,
        folderId: folderId || null,
        userId,
        status: 'PENDING',
      },
    });

    return { uploadUrl, fileId: file.id };
  });

  // Complete Upload
  fastify.post('/:id/complete', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const userId = getUserIdFromRequest(request);

    const file = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) return reply.status(404).send({ message: 'File not found' });

    // Update file status and user storage usage
    await prisma.$transaction([
      prisma.file.update({
        where: { id },
        data: { status: 'UPLOADED' },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { storageUsed: { increment: file.size } },
      }),
    ]);

    return { message: 'Upload confirmed' };
  });

  // Get Download URL
  fastify.get('/:id/download', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const userId = getUserIdFromRequest(request);

    const file = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) return reply.status(404).send({ message: 'File not found' });

    const downloadUrl = await s3.getDownloadUrl(file.s3Key);
    return { downloadUrl };
  });
}
