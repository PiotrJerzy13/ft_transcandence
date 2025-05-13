// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index.js';

interface JwtPayload {
  id: number;
  username: string;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get token from cookie or authorization header
    const token = request.cookies.token || 
      (request.headers.authorization && request.headers.authorization.split(' ')[1]);
    
    if (!token) {
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JwtPayload;
      
      // Verify user exists in DB
      const db = getDb();
      const user = await db.get('SELECT id, username FROM users WHERE id = ?', decoded.id);
      
      if (!user) {
        reply.status(401).send({ error: 'User not found' });
        return;
      }
      
      // Add user to request object
      request.user = user;
    } catch (err) {
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