import type { FastifyInstance } from 'fastify';
import authController from '../controllers/authController.js';
import { registerSchema, loginSchema, logoutSchema } from '../schemas/authSchemas.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', { schema: registerSchema }, authController.register);
  fastify.post('/login', { schema: loginSchema }, authController.login);
  fastify.post('/logout', { schema: logoutSchema }, authController.logout);
}
