import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';

// Import routes
import indexRoutes from './routes/index.mjs';
import authRoutes from './routes/auth.mjs';
import tournamentRoutes from './routes/tournament.mjs';

dotenv.config();

const app = fastify({ logger: true });

const start = async () => {
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie);
  
  // Register routes
  await app.register(indexRoutes);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(tournamentRoutes, { prefix: '/api' });

  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    console.log('Server running!');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();