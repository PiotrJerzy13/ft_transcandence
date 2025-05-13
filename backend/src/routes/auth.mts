import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';


async function routes(
  fastify: FastifyInstance)
 {
  // Register endpoint
  fastify.post('/register', async (
    request: FastifyRequest<{
      Body: {
        username: string;
        email: string;
        password: string;
      }
    }>, 
    reply: FastifyReply
  ) => {
    try {
      const { username, email, password } = request.body;
      
      // Input validation (basic)
      if (!username || !email || !password) {
        return reply.status(400).send({ error: 'Username, email and password are required' });
      }
      
      // Check if user exists
      const existingUser = await userRepository.findByUsername(username);
      if (existingUser) {
        return reply.status(409).send({ error: 'Username already exists' });
      }
      
      const existingEmail = await userRepository.findByEmail(email);
      if (existingEmail) {
        return reply.status(409).send({ error: 'Email already registered' });
      }
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create user
      const newUser = await userRepository.create({
        username,
        email,
        password_hash: passwordHash,
        status: 'online'
      });
      
      if (!newUser?.id) {
        throw new Error('User creation failed');
      }

      // Create JWT token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username }, 
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      // Set cookie
      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 // 24 hours
      });
      
      // Return user (without password)
      const { password_hash, ...userWithoutPassword } = newUser;
      return reply.status(201).send({ 
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
  
  // Login endpoint
  fastify.post('/login', async (
    request: FastifyRequest<{
      Body: {
        username: string;
        password: string;
      }
    }>, 
    reply: FastifyReply
  ) => {
    try {
      const { username, password } = request.body;
      
      // Input validation
      if (!username || !password) {
        return reply.status(400).send({ error: 'Username and password are required' });
      }
      
      // Find user
      const user = await userRepository.findByUsername(username);
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
      
      // Check password
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
      
      // Update status
      await userRepository.update(user.id, { status: 'online' });
      
      // Create JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username }, 
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      // Set cookie
      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 // 24 hours
      });
      
      // Return user (without password)
      const { password_hash, ...userWithoutPassword } = user;
      return reply.send({ 
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
  
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
	try {
	  const token = request.cookies.token || 
		(request.headers.authorization?.split(' ')[1]);
	  
	  if (token) {
		try {
// Modify your JWT verification to include definitive type checking
			const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number };

// Add runtime validation
			if (typeof decoded.id !== 'number') {
  				throw new Error('Invalid user ID in token');
	}

// Now TypeScript is certain decoded.id is a number
		await userRepository.update(decoded.id, { status: 'offline' });
		} catch (err) {
		  fastify.log.error('Token verification failed during logout', err);
		}
	  }
	  
	  reply.clearCookie('token', { path: '/' });
	  return reply.send({ message: 'Logged out successfully' });
	} catch (error) {
	  fastify.log.error(error);
	  return reply.status(500).send({ error: 'Internal Server Error' });
	}
  });
}

export default routes;