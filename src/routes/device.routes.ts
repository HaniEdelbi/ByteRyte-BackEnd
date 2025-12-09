import { FastifyInstance } from 'fastify';
import { prisma } from '../server';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotFoundError } from '../middleware/error.middleware';

// Helper functions to extract browser and OS from user agent
function extractBrowser(userAgent: string): string {
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown Browser';
}

function extractOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown OS';
}

export async function deviceRoutes(server: FastifyInstance) {
  // Get all devices/sessions for authenticated user (same email)
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
        isRevoked: true,
      },
    });

    // Format the response with friendly device info
    const formattedDevices = devices.map(device => ({
      id: device.id,
      name: device.name || 'Unknown Device',
      fingerprint: device.fingerprint,
      browser: extractBrowser(device.userAgent || ''),
      os: extractOS(device.userAgent || ''),
      ipAddress: device.ipAddress || 'Unknown',
      lastSeen: device.lastSeen,
      createdAt: device.createdAt,
      isCurrentDevice: false, // Frontend can determine this
    }));

    return reply.send({
      success: true,
      count: formattedDevices.length,
      data: formattedDevices,
    });
  });

  // Revoke device access (logout from specific device)
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

    return reply.send({
      success: true,
      message: 'Device session revoked successfully',
      data: {
        deviceId: id,
        deviceName: device.name,
      },
    });
  });
}
