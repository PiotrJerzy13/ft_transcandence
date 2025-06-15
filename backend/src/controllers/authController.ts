// VS Code shows "Cannot find module" because node_modules are in Docker, not locally. 
// Run `docker exec -it ft_backend sh` then `npm list jsonwebtoken` to confirm it's installed.
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { FastifyRequest, FastifyReply } from 'fastify';
import userRepository from '../repositories/userRepository.js';

class AuthController {
  async register(
    request: FastifyRequest<{
      Body: {
        username: string;
        email: string;
        password: string;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      console.log("Request body:", request.body);
      request.log.info("Registration attempt with data:", request.body);
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
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async login(
    request: FastifyRequest<{
      Body: {
        username: string;
        password: string;
      }
    }>,
    reply: FastifyReply
  ) {
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
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async logout(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
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
          request.log.error('Token verification failed during logout', err);
        }
      }
      
      reply.clearCookie('token', { path: '/' });
      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  // NEW: Profile endpoint
  async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const token = request.cookies.token || 
        (request.headers.authorization?.split(' ')[1]);
      
      if (!token) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number, username: string };
      } catch (err) {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      // Get user from database
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Mock stats data
      const stats = {
        level: 12,
        xp: 7850,
        xpToNext: 150,
        rank: "Pro",
        wins: 45,
        losses: 23,
        totalGames: 68,
        winStreak: 3,
        bestStreak: 8,
        totalPlayTime: "24h 35m"
      };

      // Mock achievements data
      const achievements = [
        {
          id: 1,
          name: "First Victory",
          description: "Win your first game",
          icon: "Trophy",
          unlocked: true,
          date: "2024-01-15"
        },
        {
          id: 2,
          name: "Speed Demon",
          description: "Win a game in under 60 seconds",
          icon: "Zap",
          unlocked: true,
          date: "2024-01-20"
        },
        {
          id: 3,
          name: "Sharpshooter",
          description: "Score 10 consecutive hits",
          icon: "Target",
          unlocked: false,
          progress: 7,
          maxProgress: 10
        },
        {
          id: 4,
          name: "Rising Star",
          description: "Reach Pro rank",
          icon: "Star",
          unlocked: true,
          date: "2024-02-01"
        },
        {
          id: 5,
          name: "Unstoppable",
          description: "Win 10 games in a row",
          icon: "Crown",
          unlocked: false,
          progress: 3,
          maxProgress: 10
        },
        {
          id: 6,
          name: "Marathon Player",
          description: "Play for 2 hours straight",
          icon: "Clock",
          unlocked: false,
          progress: 87,
          maxProgress: 120
        }
      ];

      // Remove password hash from user data
      const { password_hash, ...userWithoutPassword } = user;

      return reply.send({
        user: userWithoutPassword,
        stats,
        achievements
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

// Create instance and bind methods to maintain 'this' context when used as route handlers
const authController = new AuthController();

// Export bound methods to preserve context when used as route handlers
export default {
  register: authController.register.bind(authController),
  login: authController.login.bind(authController),
  logout: authController.logout.bind(authController),
  getProfile: authController.getProfile.bind(authController)
};