import { PrismaClient, AuditAction } from '@prisma/client';

export const prisma = new PrismaClient();

export class AuditService {
  // Simplified log method that accepts either object or individual parameters
  static async log(
    userIdOrRequest: string | { userId: string; ip?: string; headers?: any },
    actionType?: AuditAction | string,
    targetId?: string,
    targetType?: string,
    metadata?: any
  ) {
    if (process.env.ENABLE_AUDIT_LOGS !== 'true') {
      return;
    }

    try {
      // Handle object parameter (new way)
      if (typeof userIdOrRequest === 'object' && userIdOrRequest.userId) {
        const request = userIdOrRequest;
        await prisma.auditLog.create({
          data: {
            userId: request.userId,
            actionType: actionType as AuditAction,
            targetType: targetType || 'unknown',
            targetId: targetId || 'unknown',
            ipAddress: request.ip || 'unknown',
            userAgent: request.headers?.['user-agent'] || 'unknown',
            metadata: metadata || {},
          },
        });
      }
      // Handle individual parameters (old way - for compatibility)
      else if (typeof userIdOrRequest === 'string') {
        await prisma.auditLog.create({
          data: {
            userId: userIdOrRequest,
            actionType: actionType as AuditAction,
            targetType: targetType || 'unknown',
            targetId: targetId || 'unknown',
            ipAddress: 'unknown',
            userAgent: 'unknown',
            metadata: metadata || {},
          },
        });
      }
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  static async getLogs(filters: {
    userId?: string;
    actionType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.actionType) {
      where.actionType = filters.actionType;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    return prisma.auditLog.findMany({
      where,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { timestamp: 'desc' },
    });
  }
}
