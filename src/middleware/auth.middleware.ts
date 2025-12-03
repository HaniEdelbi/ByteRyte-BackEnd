import { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  userId: string;
}

export async function authenticate(request: FastifyRequest) {
  try {
    await request.jwtVerify();
    // Add userId to request object
    (request as AuthenticatedRequest).userId = (request.user as { userId: string }).userId;
  } catch (error) {
    throw new Error('Unauthorized');
  }
}
