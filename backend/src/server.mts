import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import type { FastifyInstance } from 'fastify';
import pongRoutes from './routes/pongRoutes.js';
import arkanoidRoutes from './routes/arkanoidRoutes.js';

// Import database
import { initializeDatabase, closeDatabase } from './db/index.js';

// Import routes
import indexRoutes from './routes/index.mjs';
import authRoutes from './routes/auth.mjs';
import userRoutes from './routes/user.mjs';
import tournamentRoutes from './routes/tournament.mjs';

dotenv.config();

const app: FastifyInstance = fastify({ logger: true });

const start = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Register Swagger - pass options as the second parameter
	// Errors if Swagger is not installed or configured correctly
	// Only present locally in development environment is correct
	// To check if installed, run: docker exec -it ft_backend npm ls @fastify/swagger @fastify/swagger-ui
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
    
    // Register plugins
    await app.register(cors, {
      origin: true,
      credentials: true,
    });
	await app.register(pongRoutes, { prefix: '/api/pong' });
	await app.register(arkanoidRoutes, { prefix: '/api/arkanoid' });
    await app.register(cookie);
    
    // Register routes
    await app.register(indexRoutes);
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(userRoutes, { prefix: '/api/user' });
    await app.register(tournamentRoutes, { prefix: '/api' });

    // Graceful shutdown
    const closeGracefully = async (signal: NodeJS.Signals) => {
      app.log.info(`Received signal to terminate: ${signal}`);
    
      await app.close();
      app.log.info('Fastify server closed');
      
      await closeDatabase();
      
      process.exit(0);
    };
    
    // Listen for termination signals
    process.on('SIGINT', closeGracefully);
    process.on('SIGTERM', closeGracefully);

    app.ready(err => {
      if (err) throw err;
      app.printRoutes(); // Debug: logs all registered routes to console
    });
    
    // Start server
    await app.listen({ 
      port: Number(process.env.PORT) || 3000, 
      host: '0.0.0.0' 
    });
    console.log(`Server running on port ${Number(process.env.PORT) || 3000}`);
    console.log(`Swagger documentation available at http://localhost:${Number(process.env.PORT) || 3000}/documentation`);
  } catch (err) {
    app.log.error(err);
    await closeDatabase();
    process.exit(1);
  }
};

start();