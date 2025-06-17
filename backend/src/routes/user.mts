import type { FastifyInstance } from 'fastify';
import userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { getProfileSchema, gameResultSchema } from '../schemas/userSchemas.js';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/profile', {
    preHandler: authenticate,
    schema: getProfileSchema
  }, userController.getProfile);

  fastify.post('/game-result', {
    preHandler: authenticate,
    schema: gameResultSchema
  }, userController.updateGameResult);

  fastify.get('/me', {
    preHandler: authenticate
  }, async (request, _reply) => {
    return {
      id: request.user!.id,
      username: request.user!.username
    };
  });
}
