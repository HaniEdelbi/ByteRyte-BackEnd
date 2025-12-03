import { FastifyInstance } from 'fastify';
import { prisma } from '../server';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotFoundError } from '../middleware/error.middleware';

export async function deviceRoutes(server: FastifyInstance) {
  // Get all devices for user
  server.get('/', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;

    const devices = await prisma.device.findMany({
      where: {
        userId,
        isRevoked: false,
      },
      orderBy: {
        lastSeen: 'desc',
      },
      select: {
        id: true,
        fingerprint: true,
        name: true,
        ipAddress: true,
        userAgent: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    reply.send({
      success: true,
      data: devices,
    });
  });

  // Revoke device access
  server.delete('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      throw new NotFoundError('Device');
    }

    if (device.userId !== userId) {
      throw new NotFoundError('Device');
    }

    await prisma.device.update({
      where: { id },
      data: { isRevoked: true },
    });

    reply.send({
      success: true,
      data: { message: 'Device revoked successfully' },
    });
  });
}
