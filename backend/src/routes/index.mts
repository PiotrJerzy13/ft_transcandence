import { FastifyInstance } from 'fastify';

export default async function indexRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    return { message: 'Hello from backend' };
  });

  fastify.get('/ping', async () => {
    return { pong: 'it works!' };
  });

}