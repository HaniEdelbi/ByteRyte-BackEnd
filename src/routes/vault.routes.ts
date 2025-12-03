import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server';
import { AuditService } from '../services/audit.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/error.middleware';
import { CreateVaultRequest } from '../models/types';

const createVaultSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['PERSONAL', 'GROUP', 'STEALTH']),
  encryptedVaultKey: z.string().min(1),
});

export async function vaultRoutes(server: FastifyInstance) {
  // Get all vaults for authenticated user
  server.get('/', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;

    const vaults = await prisma.vault.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        _count: {
          select: { items: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    reply.send({
      success: true,
      data: vaults.map((vault) => ({
        id: vault.id,
        name: vault.name,
        type: vault.type,
        itemCount: vault._count.items,
        isOwner: vault.ownerId === userId,
        memberCount: vault.members.length,
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt,
      })),
    });
  });

  // Get single vault details
  server.get('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };

    const vault = await prisma.vault.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!vault) {
      throw new NotFoundError('Vault');
    }

    // Check access
    const hasAccess =
      vault.ownerId === userId ||
      vault.members.some((m) => m.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this vault');
    }

    // Return encrypted vault key for this user
    let encryptedVaultKey = vault.encryptedVaultKey;
    if (vault.ownerId !== userId) {
      const membership = vault.members.find((m) => m.userId === userId);
      encryptedVaultKey = membership?.encryptedVaultKey || '';
    }

    await AuditService.log(
      request as AuthenticatedRequest,
      'VAULT_ACCESSED',
      vault.id,
      'vault'
    );

    reply.send({
      success: true,
      data: {
        id: vault.id,
        name: vault.name,
        type: vault.type,
        encryptedVaultKey,
        isOwner: vault.ownerId === userId,
        owner: vault.owner,
        members: vault.members.map((m) => ({
          userId: m.userId,
          email: m.user.email,
          role: m.role,
          addedAt: m.addedAt,
        })),
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt,
      },
    });
  });

  // Create new vault
  server.post<{ Body: CreateVaultRequest }>(
    '/',
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const validation = createVaultSchema.safeParse(request.body);

      if (!validation.success) {
        throw new ValidationError('Invalid request data');
      }

      const { name, type, encryptedVaultKey } = validation.data;

      const vault = await prisma.vault.create({
        data: {
          name,
          type,
          encryptedVaultKey,
          ownerId: userId,
        },
      });

      await AuditService.log(
        request as AuthenticatedRequest,
        'VAULT_CREATED',
        vault.id,
        'vault',
        { vaultName: name, vaultType: type }
      );

      reply.status(201).send({
        success: true,
        data: vault,
      });
    }
  );

  // Delete vault
  server.delete('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };

    const vault = await prisma.vault.findUnique({
      where: { id },
    });

    if (!vault) {
      throw new NotFoundError('Vault');
    }

    if (vault.ownerId !== userId) {
      throw new ForbiddenError('Only the vault owner can delete it');
    }

    await prisma.vault.delete({
      where: { id },
    });

    await AuditService.log(
      request as AuthenticatedRequest,
      'VAULT_DELETED',
      vault.id,
      'vault',
      { vaultName: vault.name }
    );

    reply.send({
      success: true,
      data: { message: 'Vault deleted successfully' },
    });
  });

  // Get vault items
  server.get('/:id/items', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };

    // Check vault access
    const vault = await prisma.vault.findUnique({
      where: { id },
      include: {
        members: true,
      },
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

    // Get items
    const items = await prisma.item.findMany({
      where: {
        vaultId: id,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    reply.send({
      success: true,
      data: items,
    });
  });
}
