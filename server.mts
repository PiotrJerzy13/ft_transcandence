import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';

dotenv.config();

const app = fastify({ logger: true });

const start = async () => {
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie);

  app.get('/', async () => {
    return { message: 'Hello from backend' };
  });

  app.get('/ping', async () => {
    return { pong: 'it works!' };
  });

  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    console.log('Server running!');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
