import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server';
import { AuditService } from '../services/audit.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/error.middleware';
import { CreateItemRequest, UpdateItemRequest } from '../models/types';

const createPasswordSchema = z.object({
  vaultId: z.string().min(1),
  encryptedBlob: z.string().min(1),
  category: z.enum(['login', 'payment', 'secure-note', 'other']).optional().default('other'),
  favorite: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional(),
});

const updatePasswordSchema = z.object({
  encryptedBlob: z.string().min(1).optional(),
  category: z.enum(['login', 'payment', 'secure-note', 'other']).optional(),
  favorite: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Password routes - Alias for item routes with password-specific naming
 * This provides backwards compatibility and clearer API naming for password operations
 */
export async function passwordRoutes(server: FastifyInstance) {

  server.post<{ Body: CreateItemRequest }>(
    '/',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      

      console.log('Received request body:', JSON.stringify(request.body, null, 2));
      
      const validation = createPasswordSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Invalid request data',
          details: validation.error.errors,
        });
      }

      const { vaultId, encryptedBlob, category, favorite, metadata } = validation.data;


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


      const categoryMap: Record<string, 'LOGIN' | 'PAYMENT' | 'SECURE_NOTE' | 'OTHER'> = {
        'login': 'LOGIN',
        'payment': 'PAYMENT',
        'secure-note': 'SECURE_NOTE',
        'other': 'OTHER',
      };


      const item = await prisma.item.create({
        data: {
          vaultId,
          encryptedBlob,
          category: categoryMap[category || 'other'],
          favorite: favorite || false,
          metadata: metadata || {},
        },
      });


      await AuditService.log(
        request as AuthenticatedRequest,
        'ITEM_CREATED',
        item.id,
        'item',
        { vaultId, itemType: 'password' }
      );

      return reply.status(201).send({
        success: true,
        message: 'Password created successfully',
        data: item,
      });
    }
  );


  server.get(
    '/',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;


      const vaults = await prisma.vault.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        include: {
          items: true,
        },
      });


      const items = vaults.flatMap(vault => vault.items);

      return reply.send({
        success: true,
        count: items.length,
        items: items.map(item => ({
          id: item.id,
          vaultId: item.vaultId,
          encryptedBlob: item.encryptedBlob,
          category: item.category.toLowerCase().replace('_', '-'),
          favorite: item.favorite,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      });
    }
  );


  server.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;

      const item = await prisma.item.findUnique({
        where: { id },
        include: { vault: { include: { members: true } } },
      });

      if (!item) {
        throw new NotFoundError('Password');
      }


      const hasAccess =
        item.vault.ownerId === userId ||
        item.vault.members.some((m: any) => m.userId === userId);

      if (!hasAccess) {
        throw new ForbiddenError('You do not have access to this password');
      }

      return reply.send({ item });
    }
  );


  server.put<{ Params: { id: string }; Body: UpdateItemRequest }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;
      const validation = updatePasswordSchema.safeParse(request.body);

      if (!validation.success) {
        throw new ValidationError('Invalid request data');
      }

      const { encryptedBlob, category, favorite, metadata } = validation.data;


      const item = await prisma.item.findUnique({
        where: { id },
        include: { vault: { include: { members: true } } },
      });

      if (!item) {
        throw new NotFoundError('Password');
      }

      const hasWriteAccess =
        item.vault.ownerId === userId ||
        item.vault.members.some(
          (m) => m.userId === userId && m.role !== 'READ_ONLY'
        );

      if (!hasWriteAccess) {
        throw new ForbiddenError('You do not have permission to update this password');
      }


      const categoryMap: Record<string, 'LOGIN' | 'PAYMENT' | 'SECURE_NOTE' | 'OTHER'> = {
        'login': 'LOGIN',
        'payment': 'PAYMENT',
        'secure-note': 'SECURE_NOTE',
        'other': 'OTHER',
      };


      const updatedItem = await prisma.item.update({
        where: { id },
        data: {
          encryptedBlob: encryptedBlob || item.encryptedBlob,
          category: category ? categoryMap[category] : item.category,
          favorite: favorite !== undefined ? favorite : item.favorite,
          metadata: metadata || item.metadata,
        },
      });


      await AuditService.log(
        request as AuthenticatedRequest,
        'ITEM_UPDATED',
        id,
        'item',
        { vaultId: item.vaultId, itemType: 'password' }
      );

      return reply.send({
        success: true,
        message: 'Password updated successfully',
        data: {
          id: updatedItem.id,
          updatedAt: updatedItem.updatedAt,
        },
      });
    }
  );


  server.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;


      const item = await prisma.item.findUnique({
        where: { id },
        include: { vault: { include: { members: true } } },
      });

      if (!item) {
        throw new NotFoundError('Password');
      }

      const hasWriteAccess =
        item.vault.ownerId === userId ||
        item.vault.members.some(
          (m) => m.userId === userId && m.role !== 'READ_ONLY'
        );

      if (!hasWriteAccess) {
        throw new ForbiddenError('You do not have permission to delete this password');
      }


      await prisma.item.delete({
        where: { id },
      });


      await AuditService.log(
        request as AuthenticatedRequest,
        'ITEM_DELETED',
        id,
        'item',
        { vaultId: item.vaultId, itemType: 'password' }
      );

      return reply.send({
        success: true,
        message: 'Password deleted successfully',
      });
    }
  );
}

