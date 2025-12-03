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
  metadata: z.record(z.any()).optional(),
});

const updatePasswordSchema = z.object({
  encryptedBlob: z.string().min(1).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Password routes - Alias for item routes with password-specific naming
 * This provides backwards compatibility and clearer API naming for password operations
 */
export async function passwordRoutes(server: FastifyInstance) {
  // Create new password
  server.post<{ Body: CreateItemRequest }>(
    '/',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      
      // Log the incoming request body for debugging
      console.log('Received request body:', JSON.stringify(request.body, null, 2));
      
      const validation = createPasswordSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Invalid request data',
          details: validation.error.errors,
        });
      }

      const { vaultId, encryptedBlob, metadata } = validation.data;

      // Check vault access
      const vault = await prisma.vault.findUnique({
        where: { id: vaultId },
        include: { members: true },
      });

      if (!vault) {
        throw new NotFoundError('Vault');
      }

      const hasAccess =
        vault.ownerId === userId ||
        vault.members.some((m) => m.userId === userId);

      if (!hasAccess) {
        throw new ForbiddenError('You do not have access to this vault');
      }

      // Create the password item
      const item = await prisma.item.create({
        data: {
          vaultId,
          encryptedBlob,
          metadata: metadata || {},
        },
      });

      // Log the action
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

  // Get all passwords for authenticated user
  server.get(
    '/',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;

      // Get all vaults the user has access to
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

      // Flatten all items from all vaults
      const items = vaults.flatMap(vault => vault.items);

      return reply.send({
        items,
        count: items.length,
      });
    }
  );

  // Get a specific password by ID
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

      // Check access
      const hasAccess =
        item.vault.ownerId === userId ||
        item.vault.members.some((m) => m.userId === userId);

      if (!hasAccess) {
        throw new ForbiddenError('You do not have access to this password');
      }

      return reply.send({ item });
    }
  );

  // Update a password
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

      const { encryptedBlob, metadata } = validation.data;

      // Get item and check access
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

      // Update the password
      const updatedItem = await prisma.item.update({
        where: { id },
        data: {
          encryptedBlob: encryptedBlob || item.encryptedBlob,
          metadata: metadata || item.metadata,
        },
      });

      // Log the action
      await AuditService.log(
        request as AuthenticatedRequest,
        'ITEM_UPDATED',
        id,
        'item',
        { vaultId: item.vaultId, itemType: 'password' }
      );

      return reply.send({
        message: 'Password updated successfully',
        item: updatedItem,
      });
    }
  );

  // Delete a password
  server.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;

      // Get item and check access
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

      // Delete the password
      await prisma.item.delete({
        where: { id },
      });

      // Log the action
      await AuditService.log(
        request as AuthenticatedRequest,
        'ITEM_DELETED',
        id,
        'item',
        { vaultId: item.vaultId, itemType: 'password' }
      );

      return reply.send({
        message: 'Password deleted successfully',
      });
    }
  );
}
