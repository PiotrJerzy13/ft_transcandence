// Enhanced version of your auth.ts with debugging
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
    console.log('🔐 Auth middleware called for:', request.method, request.url);
    console.log('🍪 Cookies:', request.cookies);
    console.log('📋 Headers:', request.headers.authorization);
    
    // Get token from cookie or authorization header
    const token = request.cookies.token || 
      (request.headers.authorization && request.headers.authorization.split(' ')[1]);
    
    if (!token) {
      console.log('❌ No token found');
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }
    
    console.log('🎫 Token found:', token.substring(0, 20) + '...');
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JwtPayload;
      
      console.log('✅ Token decoded:', decoded);
      
      // Verify user exists in DB
      const db = getDb();
      const user = await db.get('SELECT id, username FROM users WHERE id = ?', decoded.id);
      
      if (!user) {
        console.log('❌ User not found in DB for id:', decoded.id);
        reply.status(401).send({ error: 'User not found' });
        return;
      }
      
      console.log('👤 User found:', user);
      
      // Add user to request object
      request.user = user;
      console.log('✅ User attached to request');
    } catch (err) {
      console.log('❌ Token verification failed:', err);
      reply.status(401).send({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    console.error('💥 Authentication error:', error);
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