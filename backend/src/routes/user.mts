// // src/routes/user.mts
// import type { FastifyInstance } from 'fastify';
// import userController from '../controllers/userController.js';
// import { authenticate } from '../middleware/auth.js';

// export default async function userRoutes(fastify: FastifyInstance) {
//   // Apply authentication middleware to all routes
//   fastify.addHook('preHandler', authenticate);

//   // Get user profile with stats and achievements
//   fastify.get('/profile', userController.getProfile);

//   // Update game result (for tracking stats)
//   fastify.post('/game-result', userController.updateGameResult);
// }
// src/routes/user.mts
import type { FastifyInstance } from 'fastify';
import userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

export default async function userRoutes(fastify: FastifyInstance) {
  // Get user profile with stats and achievements - with explicit auth
  fastify.get('/profile', {
    preHandler: authenticate
  }, userController.getProfile);

  // Update game result (for tracking stats) - with explicit auth
  fastify.post('/game-result', {
    preHandler: authenticate
  }, userController.updateGameResult);
}