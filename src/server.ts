import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

// Routes
import { authRoutes } from './routes/auth.routes';
import { vaultRoutes } from './routes/vault.routes';
import { itemRoutes } from './routes/item.routes';
import { deviceRoutes } from './routes/device.routes';
import { auditRoutes } from './routes/audit.routes';
import { passwordRoutes } from './routes/password.routes';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Create Fastify instance
const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development',
});

// Register plugins
async function buildServer() {
  // Security - Helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable CSP for API
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.CORS_ORIGIN || 'http://localhost:8080')
      : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Rate Limiting
  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000'), // 1 minute
  });

  // JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'byteryte-super-secret-jwt-key-change-in-production',
  });

  // Verify JWT setup
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Using default JWT secret in production!');
  }

  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
    };
  });

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(vaultRoutes, { prefix: '/api/vaults' });
  await fastify.register(itemRoutes, { prefix: '/api/items' });
  await fastify.register(passwordRoutes, { prefix: '/api/passwords' });
  await fastify.register(deviceRoutes, { prefix: '/api/devices' });
  await fastify.register(auditRoutes, { prefix: '/api/audit' });

  // 404 handler - return JSON instead of HTML
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  // Global error handler
  fastify.setErrorHandler((error: any, _request, reply) => {
    fastify.log.error(error);

    // Always set Content-Type to JSON
    reply.type('application/json');

    // Handle known error types
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name || 'Error',
        message: error.message,
        code: error.code,
      });
    }

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'ValidationError',
        message: 'Invalid request data',
        details: error.validation,
      });
    }

    // Handle Prisma errors
    if (error.code?.startsWith('P')) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'DatabaseError',
        message: 'Database operation failed',
        code: error.code,
      });
    }

    // Default error response
    return reply.status(500).send({
      statusCode: 500,
      error: 'InternalServerError',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
    });
  });

  return fastify;
}

// Start server
async function start() {
  try {
    const server = await buildServer();

    const PORT = parseInt(process.env.PORT || '3000');
    const HOST = process.env.HOST || '0.0.0.0';

    await server.listen({ port: PORT, host: HOST });

    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🔐 ByteRyte Password Wallet API                    ║
║                                                       ║
║   Server: http://${HOST}:${PORT}                    ║
║   Health: http://${HOST}:${PORT}/health             ║
║   Env:    ${process.env.NODE_ENV || 'development'}                                ║
║   DB:     MongoDB Atlas                              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
start();
