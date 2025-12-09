import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server';
import { SessionService } from '../services/session.service';


const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  passwordVerifier: z.string().min(1),
  encryptedVaultKey: z.string().min(50).max(500), // AES-GCM encrypted vault key (base64)
  deviceFingerprint: z.string().min(1).optional().default('web-device'),
});

const loginSchema = z.object({
  email: z.string().email(),
  passwordVerifier: z.string().min(1),
  deviceFingerprint: z.string().min(1).optional().default('web-device'), 
  deviceName: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function authRoutes(server: FastifyInstance) {

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


    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(409).send({
        error: 'UserExistsError',
        message: 'User with this email already exists',
      });
    }




    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordVerifier: body.passwordVerifier,
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
        name: true,
        createdAt: true,
        vaults: {
          select: {
            id: true,
            encryptedVaultKey: true,
          },
        },
      },
    });


    const token = server.jwt.sign(
      { userId: user.id },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );


    await SessionService.createSession(user.id, 'web-device', token);

    return reply.status(201).send({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      vault: {
        id: user.vaults[0]?.id,
        encryptedVaultKey: user.vaults[0]?.encryptedVaultKey,
      },
    });
  });


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


    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordVerifier: true,
        totpSecret: true,
        createdAt: true,
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


    const isValid = body.passwordVerifier === user.passwordVerifier;

    if (!isValid) {
      return reply.status(401).send({
        error: 'UnauthorizedError',
        message: 'Invalid email or password',
      });
    }


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


    const token = server.jwt.sign(
      { userId: user.id },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );


    await SessionService.createSession(user.id, body.deviceFingerprint, token);
    await SessionService.updateSessionActivity(user.id, body.deviceFingerprint);

    return reply.send({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      vault: {
        id: user.vaults[0]?.id,
        encryptedVaultKey: user.vaults[0]?.encryptedVaultKey,
      },
    });
  });


  server.post('/logout', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: true,
      },
    },
  }, async (request, reply) => {

    try {

      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = server.jwt.verify(token) as { userId: string };
          await SessionService.destroySession(decoded.userId);
        } catch (err) {

        }
      }
    } catch (error) {

    }
    
    return reply.status(200).send({ success: true, message: 'Logged out successfully' });
  });


  server.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body);

    try {

      const decoded = server.jwt.verify(body.refreshToken) as { userId: string };


      const isValid = await SessionService.validateSession(decoded.userId);
      if (!isValid) {
        return reply.status(401).send({
          error: 'UnauthorizedError',
          message: 'Session no longer valid',
        });
      }


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


  server.get('/sessions', async (request, reply) => {
    try {
      await request.jwtVerify();
      const userId = (request.user as { userId: string }).userId;

      const sessions = await SessionService.getUserSessions(userId);

      return reply.send({
        success: true,
        data: sessions,
      });
    } catch (error) {
      return reply.status(401).send({
        error: 'UnauthorizedError',
        message: 'Authentication required',
      });
    }
  });
}
