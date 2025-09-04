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
  // This is a startup error, so console.error is acceptable
  console.error('FATAL ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    request.log.debug({ method: request.method, url: request.url }, 'Authentication middleware triggered');
    request.log.debug({ cookies: request.cookies }, 'Cookies received');
    request.log.debug({ authorization: request.headers.authorization }, 'Authorization header received');
    
    // Get token from cookie or authorization header
    const authHeader = request.headers.authorization;
    const cookieToken = request.cookies.token;
    
    console.log('🔍 Auth Debug - Authorization header:', authHeader);
    console.log('🔍 Auth Debug - Cookie token:', cookieToken);
    
    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('🔍 Auth Debug - Extracted token from header:', token ? token.substring(0, 20) + '...' : 'null');
    } else if (cookieToken) {
      token = cookieToken;
      console.log('🔍 Auth Debug - Using cookie token:', token.substring(0, 20) + '...');
    }
    
    if (!token) {
      console.log('❌ Auth Debug - No token found');
      request.log.warn('Authentication failed: no token provided');
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }
    
    request.log.debug({ token: token.substring(0, 20) + '...' }, 'Token found for verification');
    
    try {
      // Verify token using the required JWT_SECRET
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
      
      request.log.debug({ decoded }, 'Token successfully decoded');
      
      // Verify user exists in DB using Knex
      const db = getDb();
      const user = await db('users')
        .select('id', 'username')
        .where('id', decoded.id)
        .first();
      
      if (!user) {
        request.log.warn({ userId: decoded.id }, 'Authentication failed: user from token not found in DB');
        reply.status(401).send({ error: 'User not found' });
        return;
      }
      
      request.log.debug({ user }, 'Authenticated user found in DB');
      
      // Add user to request object
      request.user = user;
      request.log.debug({ userId: user.id }, 'User attached to request');
    } catch (err) {
      request.log.warn({ err }, 'Token verification failed');
      reply.status(401).send({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    request.log.error({ err: error }, 'Internal server error during authentication middleware');
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