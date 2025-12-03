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
    const err: any = new Error('Authentication required. Please login again.');
    err.statusCode = 401;
    throw err;
  }
}
