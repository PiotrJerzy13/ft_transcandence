import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';
import type { FastifyInstance } from 'fastify';

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
    
    // Register plugins
    await app.register(cors, {
      origin: true,
      credentials: true,
    });

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

    // Start server
    await app.listen({ 
      port: Number(process.env.PORT) || 3000, 
      host: '0.0.0.0' 
    });
    console.log(`Server running on port ${Number(process.env.PORT) || 3000}`);
  } catch (err) {
    app.log.error(err);
    await closeDatabase();
    process.exit(1);
  }
};

start();