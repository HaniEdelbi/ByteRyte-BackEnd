import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../server';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  passwordVerifier: z.string().min(1),
  encryptedVaultKey: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  passwordVerifier: z.string().min(1),
  deviceFingerprint: z.string().min(1),
  deviceName: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function authRoutes(server: FastifyInstance) {
  // Register new user
  server.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

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

    // Hash password verifier
    const hashedVerifier = await bcrypt.hash(
      body.passwordVerifier,
      parseInt(process.env.BCRYPT_ROUNDS || '12')
    );

    // Create user and default vault in transaction
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordVerifier: hashedVerifier,
        vaults: {
          create: {
            name: 'My Vault',
            type: 'PERSONAL',
            encryptedVaultKey: body.encryptedVaultKey,
          },
        },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = server.jwt.sign(
      { userId: user.id },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return reply.status(201).send({
      user,
      token,
    });
  });

  // Login
  server.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

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

    // Verify password
    const isValid = await bcrypt.compare(body.passwordVerifier, user.passwordVerifier);

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
