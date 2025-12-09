import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server';
import { AuditService } from '../services/audit.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/error.middleware';
import { CreateItemRequest, UpdateItemRequest } from '../models/types';

const createItemSchema = z.object({
  vaultId: z.string().uuid(),
  encryptedBlob: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const updateItemSchema = z.object({
  encryptedBlob: z.string().min(1).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function itemRoutes(server: FastifyInstance) {

  server.post<{ Body: CreateItemRequest }>(
    '/',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const validation = createItemSchema.safeParse(request.body);

      if (!validation.success) {
        throw new ValidationError('Invalid request data');
      }

      const { vaultId, encryptedBlob, metadata } = validation.data;


      const vault = await prisma.vault.findUnique({
        where: { id: vaultId },
        include: { members: true },
      });

      if (!vault) {
        throw new NotFoundError('Vault');
      }

      const hasAccess =
        vault.ownerId === userId ||
        vault.members.some((m: any) => m.userId === userId);

      if (!hasAccess) {
        throw new ForbiddenError('You do not have access to this vault');
      }

      const item = await prisma.item.create({
        data: {
          vaultId,
          encryptedBlob,
          metadata,
        },
      });

      await AuditService.log(
        request as AuthenticatedRequest,
        'ITEM_CREATED',
        item.id,
        'item',
        { vaultId }
      );

      reply.status(201).send({
        success: true,
        data: item,
      });
    }
  );


  server.get('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        vault: {
          include: { members: true },
        },
      },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundError('Item');
    }


    const hasAccess =
      item.vault.ownerId === userId ||
      item.vault.members.some((m: any) => m.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this item');
    }


    await prisma.item.update({
      where: { id },
      data: { lastViewedAt: new Date() },
    });

    await AuditService.log(
      request as AuthenticatedRequest,
      'ITEM_VIEWED',
      item.id,
      'item'
    );

    reply.send({
      success: true,
      data: item,
    });
  });


  server.put<{ Body: UpdateItemRequest }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const validation = updateItemSchema.safeParse(request.body);

      if (!validation.success) {
        throw new ValidationError('Invalid request data');
      }

      const { encryptedBlob, metadata } = validation.data;

      const item = await prisma.item.findUnique({
        where: { id },
        include: {
          vault: {
            include: { members: true },
          },
        },
      });

      if (!item || item.isDeleted) {
        throw new NotFoundError('Item');
      }


      const hasWriteAccess =
        item.vault.ownerId === userId ||
        item.vault.members.some(
          (m) => m.userId === userId && m.role !== 'READ_ONLY'
        );

      if (!hasWriteAccess) {
        throw new ForbiddenError('You do not have write access to this item');
      }

      const updatedItem = await prisma.item.update({
        where: { id },
        data: {
          ...(encryptedBlob && { encryptedBlob }),
          ...(metadata && { metadata }),
        },
      });

      await AuditService.log(
        request as AuthenticatedRequest,
        'ITEM_UPDATED',
        item.id,
        'item'
      );

      reply.send({
        success: true,
        data: updatedItem,
      });
    }
  );


  server.delete('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        vault: {
          include: { members: true },
        },
      },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundError('Item');
    }


    const hasWriteAccess =
      item.vault.ownerId === userId ||
      item.vault.members.some(
        (m) => m.userId === userId && ['OWNER', 'ADMIN', 'MEMBER'].includes(m.role)
      );

    if (!hasWriteAccess) {
      throw new ForbiddenError('You do not have permission to delete this item');
    }


    await prisma.item.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await AuditService.log(
      request as AuthenticatedRequest,
      'ITEM_DELETED',
      item.id,
      'item'
    );

    reply.send({
      success: true,
      data: { message: 'Item deleted successfully' },
    });
  });


  server.post('/:id/copy', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        vault: {
          include: { members: true },
        },
      },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundError('Item');
    }


    const hasAccess =
      item.vault.ownerId === userId ||
      item.vault.members.some((m: any) => m.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this item');
    }


    await prisma.item.update({
      where: { id },
      data: { lastCopiedAt: new Date() },
    });

    await AuditService.log(
      request as AuthenticatedRequest,
      'ITEM_COPIED',
      item.id,
      'item'
    );

    reply.send({
      success: true,
      data: { message: 'Copy event logged' },
    });
  });
}

