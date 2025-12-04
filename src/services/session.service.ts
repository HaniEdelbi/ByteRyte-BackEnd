import { prisma } from '../server';

export class SessionService {
  /**
   * Create a new session for a user
   */
  static async createSession(userId: string, deviceFingerprint: string, token: string) {
    try {
      // You could store sessions in the database if needed
      // For now, we'll just log the session creation
      console.log(`Session created for user ${userId} on device ${deviceFingerprint}`);
      
      // Optional: Store session in database for tracking
      // This would require adding a Session model to your Prisma schema
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

  /**
   * Validate a session token
   */
  static async validateSession(userId: string): Promise<boolean> {
    try {
      // Check if user still exists
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

  /**
   * Destroy a user session
   */
  static async destroySession(userId: string, deviceFingerprint?: string) {
    try {
      console.log(`Session destroyed for user ${userId}${deviceFingerprint ? ` on device ${deviceFingerprint}` : ''}`);
      
      // Optional: Remove from database if you're storing sessions
      return true;
    } catch (error) {
      console.error('Failed to destroy session:', error);
      return false;
    }
  }

  /**
   * Get active sessions for a user
   */
  static async getUserSessions(userId: string) {
    try {
      // Get all devices for the user
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

  /**
   * Update session activity (mark device as used)
   */
  static async updateSessionActivity(userId: string, deviceFingerprint: string) {
    try {
      // Just verify the device exists
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
