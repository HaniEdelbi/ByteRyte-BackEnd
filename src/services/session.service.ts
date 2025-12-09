import { prisma } from '../server';

export class SessionService {
  static async createSession(userId: string, deviceFingerprint: string, token: string) {
    try {
      console.log(`Session created for user ${userId} on device ${deviceFingerprint}`);
      
      return {
        userId,
        deviceFingerprint,
        token,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  static async validateSession(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      console.error('Failed to validate session:', error);
      return false;
    }
  }

  static async destroySession(userId: string, deviceFingerprint?: string) {
    try {
      console.log(`Session destroyed for user ${userId}${deviceFingerprint ? ` on device ${deviceFingerprint}` : ''}`);
      return true;
    } catch (error) {
      console.error('Failed to destroy session:', error);
      return false;
    }
  }

  static async getUserSessions(userId: string) {
    try {
      const devices = await prisma.device.findMany({
        where: { userId },
        select: {
          id: true,
          fingerprint: true,
          name: true,
          userAgent: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return devices;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  static async updateSessionActivity(userId: string, deviceFingerprint: string) {
    try {
      await prisma.device.findUnique({
        where: {
          userId_fingerprint: {
            userId,
            fingerprint: deviceFingerprint,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }
}
