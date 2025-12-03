import { FastifyInstance } from 'fastify';
import { AuditService } from '../services/audit.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export async function auditRoutes(server: FastifyInstance) {
  // Get audit logs for authenticated user
  server.get('/', { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const {
      actionType,
      startDate,
      endDate,
      limit,
      offset,
    } = request.query as {
      actionType?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };

    const logs = await AuditService.getLogs({
      userId,
      actionType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    reply.send({
      success: true,
      data: logs,
    });
  });
}
