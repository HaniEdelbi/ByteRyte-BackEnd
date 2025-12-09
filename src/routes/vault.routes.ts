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
  encryptedVaultKey: z.string().min(50).max(500), // AES-GCM encrypted vault key (base64)
});

const updateVaultSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const addMemberSchema = z.object({
  userEmail: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'READ_ONLY']).default('MEMBER'),
  encryptedVaultKey: z.string().min(50).max(500), // Vault key encrypted with member's public key
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'READ_ONLY']),
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
      data: vaults.map((vault: any) => ({
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
      vault.members.some((m: any) => m.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this vault');
    }

    // Return encrypted vault key for this user
    let encryptedVaultKey = vault.encryptedVaultKey;
    if (vault.ownerId !== userId) {
      const membership = vault.members.find((m: any) => m.userId === userId);
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
        message: 'Vault created successfully',
        data: vault,
      });
    }
  );

  // Update vault
  server.put('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const validation = updateVaultSchema.safeParse(request.body);

    if (!validation.success) {
      throw new ValidationError('Invalid request data');
    }

    const { name } = validation.data;

    const vault = await prisma.vault.findUnique({
      where: { id },
    });

    if (!vault) {
      throw new NotFoundError('Vault');
    }

    if (vault.ownerId !== userId) {
      throw new ForbiddenError('Only the vault owner can update it');
    }

    const updatedVault = await prisma.vault.update({
      where: { id },
      data: { name },
    });

    await AuditService.log(
      request as AuthenticatedRequest,
      'VAULT_UPDATED',
      vault.id,
      'vault',
      { oldName: vault.name, newName: name }
    );

    reply.send({
      success: true,
      message: 'Vault updated successfully',
      data: updatedVault,
    });
  });

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
      vault.members.some((m: any) => m.userId === userId);

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
      count: items.length,
      data: items.map(item => ({
        id: item.id,
        vaultId: item.vaultId,
        encryptedBlob: item.encryptedBlob,
        category: item.category.toLowerCase().replace('_', '-'),
        favorite: item.favorite,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    });
  });

  // Add member to vault
  server.post('/:id/members', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const validation = addMemberSchema.safeParse(request.body);

    if (!validation.success) {
      throw new ValidationError('Invalid request data');
    }

    const { userEmail, role, encryptedVaultKey } = validation.data;

    // Check vault exists and user is owner/admin
    const vault = await prisma.vault.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!vault) {
      throw new NotFoundError('Vault');
    }

    const membership = vault.members.find((m) => m.userId === userId);
    const isOwner = vault.ownerId === userId;
    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('Only vault owner or admin can add members');
    }

    // Find user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, email: true },
    });

    if (!userToAdd) {
      return reply.status(404).send({
        success: false,
        error: 'UserNotFound',
        message: `User with email ${userEmail} not found`,
      });
    }

    // Check if user is already a member
    const existingMember = vault.members.find((m) => m.userId === userToAdd.id);
    if (existingMember) {
      return reply.status(409).send({
        success: false,
        error: 'UserAlreadyMember',
        message: 'User is already a member of this vault',
      });
    }

    // Add member
    const newMember = await prisma.vaultMember.create({
      data: {
        vaultId: id,
        userId: userToAdd.id,
        role,
        encryptedVaultKey,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    await AuditService.log(
      request as AuthenticatedRequest,
      'VAULT_MEMBER_ADDED',
      vault.id,
      'vault',
      { memberEmail: userEmail, role }
    );

    reply.status(201).send({
      success: true,
      message: 'Member added successfully',
      data: {
        userId: newMember.userId,
        email: newMember.user.email,
        role: newMember.role,
        addedAt: newMember.addedAt,
      },
    });
  });

  // Update member role
  server.put('/:id/members/:memberId', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id, memberId } = request.params as { id: string; memberId: string };
    const validation = updateMemberRoleSchema.safeParse(request.body);

    if (!validation.success) {
      throw new ValidationError('Invalid request data');
    }

    const { role } = validation.data;

    // Check vault exists and user is owner/admin
    const vault = await prisma.vault.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!vault) {
      throw new NotFoundError('Vault');
    }

    const membership = vault.members.find((m) => m.userId === userId);
    const isOwner = vault.ownerId === userId;
    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('Only vault owner or admin can update member roles');
    }

    // Update member role
    const updatedMember = await prisma.vaultMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    await AuditService.log(
      request as AuthenticatedRequest,
      'VAULT_MEMBER_UPDATED',
      vault.id,
      'vault',
      { memberEmail: updatedMember.user.email, newRole: role }
    );

    reply.send({
      success: true,
      message: 'Member role updated successfully',
      data: {
        userId: updatedMember.userId,
        email: updatedMember.user.email,
        role: updatedMember.role,
      },
    });
  });

  // Remove member from vault
  server.delete('/:id/members/:memberId', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id, memberId } = request.params as { id: string; memberId: string };

    // Check vault exists and user is owner/admin
    const vault = await prisma.vault.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!vault) {
      throw new NotFoundError('Vault');
    }

    const membership = vault.members.find((m) => m.userId === userId);
    const isOwner = vault.ownerId === userId;
    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('Only vault owner or admin can remove members');
    }

    // Get member to remove
    const memberToRemove = await prisma.vaultMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!memberToRemove) {
      throw new NotFoundError('Member');
    }

    // Remove member
    await prisma.vaultMember.delete({
      where: { id: memberId },
    });

    await AuditService.log(
      request as AuthenticatedRequest,
      'VAULT_MEMBER_REMOVED',
      vault.id,
      'vault',
      { memberEmail: memberToRemove.user.email }
    );

    reply.send({
      success: true,
      message: 'Member removed successfully',
    });
  });
}
