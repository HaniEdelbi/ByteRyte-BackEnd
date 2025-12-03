import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Accept 'password' instead of 'passwordVerifier'
  encryptedVaultKey: z.string().min(1).optional(), // Make optional for simpler registration
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Accept 'password' instead of 'passwordVerifier'
  deviceFingerprint: z.string().min(1).optional().default('web-device'), // Make optional with default
  deviceName: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function authRoutes(server: FastifyInstance) {
  // Register new user
  server.post('/register', async (request, reply) => {
    const validation = registerSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
    }
    
    const body = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(409).send({
        error: 'UserExistsError',
        message: 'User with this email already exists',
      });
    }

    // In zero-knowledge architecture, the passwordVerifier is already a secure
    // client-derived key, so we store it directly without additional hashing
    // Create user and default vault in transaction
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordVerifier: body.password,
        vaults: {
          create: {
            name: 'My Vault',
            type: 'PERSONAL',
            encryptedVaultKey: body.encryptedVaultKey || 'default-key',
          },
        },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        vaults: {
          select: {
            id: true,
            encryptedVaultKey: true,
          },
        },
      },
    });

    // Generate JWT token
    const token = server.jwt.sign(
      { userId: user.id },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        vaultId: user.vaults[0]?.id || '',
        encryptedVaultKey: user.vaults[0]?.encryptedVaultKey || '',
      },
      token,
    });
  });

  // Login
  server.post('/login', async (request, reply) => {
    const validation = loginSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
    }
    
    const body = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        email: true,
        passwordVerifier: true,
        totpSecret: true,
        vaults: {
          where: { type: 'PERSONAL' },
          select: {
            id: true,
            encryptedVaultKey: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return reply.status(401).send({
        error: 'UnauthorizedError',
        message: 'Invalid email or password',
      });
    }

    // Verify password - direct comparison since passwordVerifier is client-derived
    const isValid = body.password === user.passwordVerifier;

    if (!isValid) {
      return reply.status(401).send({
        error: 'UnauthorizedError',
        message: 'Invalid email or password',
      });
    }

    // Create or update device
    await prisma.device.upsert({
      where: {
        userId_fingerprint: {
          userId: user.id,
          fingerprint: body.deviceFingerprint,
        },
      },
      update: {
        name: body.deviceName || 'Unknown Device',
      },
      create: {
        userId: user.id,
        fingerprint: body.deviceFingerprint,
        name: body.deviceName || 'Unknown Device',
        userAgent: request.headers['user-agent'] || 'Unknown',
      },
    });

    // Generate JWT token
    const token = server.jwt.sign(
      { userId: user.id },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        vaultId: user.vaults[0]?.id || '',
        encryptedVaultKey: user.vaults[0]?.encryptedVaultKey || '',
        totpEnabled: !!user.totpSecret,
      },
      token,
    });
  });

  // Logout (client-side token deletion, optional server-side blacklist)
  server.post('/logout', async (_request, reply) => {
    // In a production app, you might want to blacklist the token here
    return reply.send({ message: 'Logged out successfully' });
  });

  // Refresh token
  server.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body);

    try {
      // Verify the refresh token
      const decoded = server.jwt.verify(body.refreshToken) as { userId: string };

      // Generate new access token
      const token = server.jwt.sign(
        { userId: decoded.userId },
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return reply.send({ token });
    } catch (error) {
      return reply.status(401).send({
        error: 'UnauthorizedError',
        message: 'Invalid or expired refresh token',
      });
    }
  });
}
