import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import type { FastifyInstance } from 'fastify';
import pongRoutes from './routes/pongRoutes.js';
import arkanoidRoutes from './routes/arkanoidRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import { register, collectDefaultMetrics } from 'prom-client';
import addFormats from 'ajv-formats';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// ES module __dirname workaround
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const certDir = process.env.CERT_DIR || path.join(__dirname, '../../certs');

// Import database
import { initializeDatabase, closeDatabase } from './db/index.js';

// Import routes
import indexRoutes from './routes/index.mjs';
import authRoutes from './routes/auth.mjs';
import userRoutes from './routes/user.mjs';
import tournamentRoutes from './routes/tournament.mjs';
import matchmakingRoutes from './routes/matchmaking.mjs';
import twoFactorAuthRoutes from './routes/twoFactorAuth.mjs';
import websocketRoutes from './routes/websocket.mjs';


// Import ELK logger
// import { elkLogger } from './utils/elkLogger.js';

// Temporary mock ELK logger to avoid connection issues
const elkLogger = {
  info: (_message: string, _metadata?: any) => Promise.resolve(),
  error: (_message: string, _metadata?: any) => Promise.resolve(),
  warn: (_message: string, _metadata?: any) => Promise.resolve(),
  debug: (_message: string, _metadata?: any) => Promise.resolve()
};

dotenv.config();
console.log('LOG_LEVEL:', process.env.LOG_LEVEL);
// Enhanced logger configuration
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    log: (object: any) => {
      // Send logs to ELK in addition to console
      if (object.msg) {
        // Create a clean, serializable metadata object for ELK.
        const elkMetadata: Record<string, any> = {
          pid: process.pid,
          hostname: process.env.HOSTNAME || 'localhost',
          reqId: object.reqId,
        };

        // If the log object contains a serialized request, add it.
        if (object.req) {
          elkMetadata.req = {
            method: object.req.method,
            url: object.req.url,
            hostname: object.req.hostname,
            remoteAddress: object.req.remoteAddress,
            userAgent: object.req.userAgent
          };
        }

        // If the log object contains a serialized response, add it.
        if (object.res) {
          elkMetadata.res = {
            statusCode: object.res.statusCode,
          };
          if (object.responseTime) {
            elkMetadata.responseTime = object.responseTime;
          }
        }

        // Add any other top-level fields from the log object that are safe
        if (object.error) {
          elkMetadata.error = {
            message: object.error.message,
            stack: object.error.stack,
            statusCode: object.error.statusCode,
            validationErrors: object.error.validationErrors
          };
        }

        // Send the clean metadata object to ELK
        (elkLogger as any)[object.level]
          ? (elkLogger as any)[object.level](object.msg, elkMetadata).catch(console.error)
          : elkLogger.info(object.msg, elkMetadata).catch(console.error);
      }
      return object; // Return original object for console logging
    }
  },
  serializers: {
    req: (request: any) => ({
      method: request.method,
      url: request.url,
      hostname: request.hostname,
      remoteAddress: request.ip,
      userAgent: request.headers['user-agent']
    }),
    res: (reply: any) => ({
      statusCode: reply.statusCode
    })
  }
};

const app: FastifyInstance = fastify({ 
  logger: loggerConfig,
  ignoreTrailingSlash: true,
  // https: {
  //   key: fs.readFileSync(path.join(certDir, 'localhost.key')),
  //   cert: fs.readFileSync(path.join(certDir, 'localhost.crt'))
  // },
  ajv: {
    plugins: [
      (addFormats as unknown as (ajv: any) => any)
    ]
  }
});

// Add request logging hook
app.addHook('preHandler', async (request, _reply) => {
  request.log.info({ msg: 'Incoming request' });
});

app.addHook('onResponse', async (_request, reply) => {
  reply.log.info({
    msg: 'Request completed',
    res: reply, // This will be serialized
    responseTime: reply.getResponseTime()
  });
});

const start = async () => {
  try {
    app.log.info('Starting ft_transcendence server...');
    
    // Initialize database
    await initializeDatabase();
    app.log.info('Database initialized successfully');
    
    collectDefaultMetrics();
    app.log.info('Prometheus metrics collection started');
    
    // Register Swagger
    await app.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Tournament API',
          description: 'API for tournament management system',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://localhost:3000',
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            cookieAuth: {
              type: 'apiKey',
              in: 'cookie',
              name: 'token',
            },
          },
        },
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      uiHooks: {
        onRequest: function (_request, _reply, next) { next(); },
        preHandler: function (_request, _reply, next) { next(); },
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (_swaggerObject, _request, _reply) => {
        return _swaggerObject;
      },
      transformSpecificationClone: true,
    });
    
    app.log.info('Swagger documentation registered');
    
    try {
      // Debug environment variables
      console.log('Environment variables check:');
      console.log('COOKIE_SECRET:', process.env.COOKIE_SECRET ? 'SET' : 'NOT SET');
      console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      
      // Register plugins
      app.log.info('Registering CORS plugin...');
      await app.register(cors, {
        origin: true,
        credentials: true,
      });
      app.log.info('CORS plugin registered');
      
      try {
        app.log.info('Registering WebSocket plugin...');
        console.log('WebSocket plugin import:', websocket);
        console.log('WebSocket plugin type:', typeof websocket);
        await app.register(websocket);
        app.log.info('WebSocket plugin registered');
      } catch (error) {
        console.error('WebSocket plugin registration error details:', error);
        app.log.error('Failed to register WebSocket plugin:', error);
        throw error;
      }
      
      app.log.info('Registering pong routes...');
      await app.register(pongRoutes, { prefix: '/api/pong' });
      app.log.info('Pong routes registered');
      
      app.log.info('Registering arkanoid routes...');
      await app.register(arkanoidRoutes, { prefix: '/api/arkanoid' });
      app.log.info('Arkanoid routes registered');
      
      app.log.info('Registering leaderboard routes...');
      await app.register(leaderboardRoutes, { prefix: '/api' });
      app.log.info('Leaderboard routes registered');
      
      app.log.info('Registering cookie plugin...');
      await app.register(cookie);
      app.log.info('Cookie plugin registered');
      
      app.log.info('All plugins registered successfully');
      
      // Register routes
      try {
        app.log.info('Registering index routes...');
        await app.register(indexRoutes);
        app.log.info('Index routes registered');
      } catch (error) {
        app.log.error('Failed to register index routes:', error);
        throw error;
      }
      
      try {
        app.log.info('Registering auth routes...');
        await app.register(authRoutes, { prefix: '/api/auth' });
        app.log.info('Auth routes registered');
      } catch (error) {
        app.log.error('Failed to register auth routes:', error);
        throw error;
      }
      
      try {
        app.log.info('Registering user routes...');
        await app.register(userRoutes, { prefix: '/api/user' });
        app.log.info('User routes registered');
      } catch (error) {
        app.log.error('Failed to register user routes:', error);
        throw error;
      }
      
      try {
        app.log.info('Registering tournament routes...');
        await app.register(tournamentRoutes, { prefix: '/api' });
        app.log.info('Tournament routes registered');
      } catch (error) {
        app.log.error('Failed to register tournament routes:', error);
        throw error;
      }
      
      try {
        app.log.info('Registering matchmaking routes...');
        await app.register(matchmakingRoutes, { prefix: '/api' });
        app.log.info('Matchmaking routes registered');
      } catch (error) {
        app.log.error('Failed to register matchmaking routes:', error);
        throw error;
      }
      
      try {
        app.log.info('Registering 2FA routes...');
        await app.register(twoFactorAuthRoutes, { prefix: '/api' });
        app.log.info('2FA routes registered');
      } catch (error) {
        app.log.error('Failed to register 2FA routes:', error);
        throw error;
      }
      
      try {
        app.log.info('Registering WebSocket routes...');
        await app.register(websocketRoutes, { prefix: '/api' });
        app.log.info('WebSocket routes registered');
      } catch (error) {
        app.log.error('Failed to register WebSocket routes:', error);
        throw error;
      }
      
      app.log.info('All routes registered successfully');
    } catch (routeError) {
      app.log.error('Failed to register routes/plugins:', routeError);
      throw routeError;
    }
    
    // Prometheus metrics endpoint
    app.get('/metrics', async (_request, reply) => {
      reply.header('Content-Type', register.contentType);
      reply.send(await register.metrics());
    });

    // Health check endpoint
    app.get('/health', async (_request, reply) => {
      app.log.info('Health check requested');
      reply.send({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'ft_transcendence'
      });
    });
    
    // Error handler with ELK logging
    app.setErrorHandler(async (error, request, reply) => {
      request.log.error({
        msg: 'Unhandled error',
        error: {
          message: error.message,
          stack: error.stack,
          statusCode: error.statusCode || 500,
          validationErrors: error.validation
        }
      });

      // Customize error response based on environment and error type
      const statusCode = error.statusCode || 500;
      reply.status(statusCode);

      if (process.env.NODE_ENV === 'development') {
        // In development, send back full error details
        return reply.send({
          statusCode,
          error: error.name || 'Internal Server Error',
          message: error.message,
          stack: error.stack,
          validationErrors: error.validation,
        });
      } else {
        // In production, send a more generic message
        if (statusCode === 400 && error.validation) {
          // Handle validation errors with more detail
          return reply.send({
            statusCode,
            error: 'Bad Request',
            message: 'Validation failed',
            validationErrors: error.validation,
          });
        }
        
        if (statusCode >= 500) {
          // Log critical errors to ELK
          elkLogger.error(error.message, {
            stack: error.stack,
            statusCode: statusCode,
            originalUrl: request.url,
            method: request.method,
          }).catch(err => {
            request.log.warn('Failed to send error details to ELK', err);
          });

          return reply.send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Something went wrong',
          });
        }

        return reply.send({
          statusCode,
          error: error.name || 'Error',
          message: error.message,
        });
      }
    });
    
    // Graceful shutdown
    const closeGracefully = async (signal: NodeJS.Signals) => {
      app.log.info(`Received signal to terminate: ${signal}`);
      
      elkLogger.info('Server shutting down gracefully', { signal }).catch(err => {
        app.log.warn('Failed to send shutdown log to ELK:', err);
      });
    
      await app.close();
      app.log.info('Fastify server closed');
      
      await closeDatabase();
      
      process.exit(0);
    };
    
    // Listen for termination signals
    process.on('SIGINT', closeGracefully);
    process.on('SIGTERM', closeGracefully);

    // Simplified server startup for debugging
    try {
      await app.listen({ 
        port: Number(process.env.PORT) || 3000, 
        host: '0.0.0.0' 
      });
      
      const port = Number(process.env.PORT) || 3000;
      app.log.info(`Server running on port ${port}`);
      app.log.info(`Swagger documentation available at https://localhost:${port}/documentation`);
      
      // Send startup log to ELK
      elkLogger.info('ft_transcendence server started successfully', {
        port,
        nodeEnv: process.env.NODE_ENV || 'development',
        pid: process.pid
      }).catch(err => {
        app.log.warn('Failed to send startup log to ELK:', err);
      });
    } catch (listenError) {
      app.log.error('Failed to start server:', listenError);
      throw listenError;
    }
    
  } catch (err) {
    app.log.error('Server startup failed', err);
    await elkLogger.error('Server startup failed', { error: err });
    await closeDatabase();
    process.exit(1);
  }
};

start();