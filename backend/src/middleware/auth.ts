// VS Code shows "Cannot find module" because node_modules are in Docker, not locally. 
// Run `docker exec -it ft_backend sh` then `npm list jsonwebtoken` to confirm it's installed.
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index.js';

interface JwtPayload {
  id: number;
  username: string;
}

// Ensure JWT_SECRET is provided at startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    console.log('Auth middleware called for:', request.method, request.url);
    console.log('Cookies:', request.cookies);
    console.log('Headers:', request.headers.authorization);
    
    // Get token from cookie or authorization header
    const token = request.cookies.token || 
      (request.headers.authorization && request.headers.authorization.split(' ')[1]);
    
    if (!token) {
      console.log('No token found');
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }
    
    console.log('Token found:', token.substring(0, 20) + '...');
    
    try {
      // Verify token using the required JWT_SECRET
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
      
      console.log('Token decoded:', decoded);
      
      // Verify user exists in DB using Knex
      const db = getDb();
      const user = await db('users')
        .select('id', 'username')
        .where('id', decoded.id)
        .first();
      
      if (!user) {
        console.log('User not found in DB for id:', decoded.id);
        reply.status(401).send({ error: 'User not found' });
        return;
      }
      
      console.log('User found:', user);
      
      // Add user to request object
      request.user = user;
      console.log('User attached to request');
    } catch (err) {
      console.log('Token verification failed:', err);
      reply.status(401).send({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    reply.status(500).send({ error: 'Internal server error during authentication' });
  }
}

// Type declaration for extending FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
      username: string;
    };
  }
}