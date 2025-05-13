import type { FastifyInstance } from 'fastify';
import authController from '../controllers/authController.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);
  fastify.post('/logout', authController.logout);
}
