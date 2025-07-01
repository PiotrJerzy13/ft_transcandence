import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import type { FastifyInstance } from 'fastify';
import pongRoutes from './routes/pongRoutes.js';
import arkanoidRoutes from './routes/arkanoidRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import { register, collectDefaultMetrics } from 'prom-client';
import addFormats from 'ajv-formats';

// Import database
import { initializeDatabase, closeDatabase } from './db/index.js';

// Import routes
import indexRoutes from './routes/index.mjs';
import authRoutes from './routes/auth.mjs';
import userRoutes from './routes/user.mjs';
import tournamentRoutes from './routes/tournament.mjs';

// Import ELK logger
import { elkLogger } from './utils/elkLogger.js';

dotenv.config();

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
            url: 'http://localhost:3000',
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
    
    // Register plugins
    await app.register(cors, {
      origin: true,
      credentials: true,
    });
    await app.register(pongRoutes, { prefix: '/api/pong' });
    await app.register(arkanoidRoutes, { prefix: '/api/arkanoid' });
    await app.register(leaderboardRoutes, { prefix: '/api' });
    await app.register(cookie);
    
    app.log.info('Plugins registered successfully');
    
    // Register routes
    await app.register(indexRoutes);
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(userRoutes, { prefix: '/api/user' });
    await app.register(tournamentRoutes, { prefix: '/api' });
    
    app.log.info('Routes registered successfully');
    
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

    app.ready(err => {
      if (err) {
        app.log.error('Error during server startup', err);
        throw err;
      }
      app.printRoutes(); // Debug: logs all registered routes to console
    });
    
    // Start server
    await app.listen({ 
      port: Number(process.env.PORT) || 3000, 
      host: '0.0.0.0' 
    });
    
    const port = Number(process.env.PORT) || 3000;
    app.log.info(`Server running on port ${port}`);
    app.log.info(`Swagger documentation available at http://localhost:${port}/documentation`);
    
    // Send startup log to ELK
    elkLogger.info('ft_transcendence server started successfully', {
      port,
      nodeEnv: process.env.NODE_ENV || 'development',
      pid: process.pid
    }).catch(err => {
      app.log.warn('Failed to send startup log to ELK:', err);
    });
    
  } catch (err) {
    app.log.error('Server startup failed', err);
    await elkLogger.error('Server startup failed', { error: err });
    await closeDatabase();
    process.exit(1);
  }
};

start();