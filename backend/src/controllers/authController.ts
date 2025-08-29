// VS Code shows "Cannot find module" because node_modules are in Docker, not locally. 
// Run `docker exec -it ft_backend sh` then `npm list jsonwebtoken` to confirm it's installed.
import bcrypt from 'bcryptjs';
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
      // console.log("Request body:", request.body);
      request.log.debug({ body: request.body }, "Registration request received");
      const { username, email, password } = request.body;
      
      // Input validation (basic)
      if (!username || !email || !password) {
        return reply.status(400).send({ error: 'Username, email and password are required' });
      }
	if (password.length < 6) {
      return reply.status(400).send({ error: 'Password must be at least 6 characters long' });
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
        secure: process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true',
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
      request.log.error({ err: error }, "An unexpected error occurred during registration");
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async login(
    request: FastifyRequest<{
      Body: {
        username: string;
        password: string;
        twoFactorToken?: string;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      request.log.info({ username: request.body.username }, "[LOGIN] Step 1: Login attempt started");
      const { username, password, twoFactorToken } = request.body;
      
      // Step 2: Input validation
      if (!username || !password) {
        request.log.warn('[LOGIN] Step 2: Missing username or password');
        return reply.status(400).send({ error: 'Username and password are required' });
      }
      request.log.info('[LOGIN] Step 2: Input validated');
      
      // Step 3: Find user
      const user = await userRepository.findByUsername(username);
      request.log.debug({ user }, "[LOGIN] Step 3: User lookup completed");
      if (!user) {
        request.log.warn({ username }, "[LOGIN] Step 3: Login failed: user not found");
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
      request.log.info('[LOGIN] Step 3: User found');
      
      // Step 4: Check password
      request.log.info('[LOGIN] Step 4: Checking password');
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        request.log.warn({ username }, "[LOGIN] Step 4: Login failed: invalid password");
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
      request.log.info('[LOGIN] Step 4: Password valid');
      
      // Step 5: Check 2FA if enabled
      if (user.two_factor_enabled) {
        request.log.info('[LOGIN] Step 5: 2FA is enabled, checking token');
        if (!twoFactorToken) {
          request.log.warn('[LOGIN] Step 5: 2FA token required but not provided');
          return reply.status(401).send({ 
            error: '2FA token required',
            requires2FA: true,
            message: 'Please provide your 2FA token'
          });
        }
        
        // Import 2FA service dynamically to avoid circular dependencies
        const { TwoFactorAuthService } = await import('../services/twoFactorAuth.mjs');
        
        // Verify 2FA token
        docker-compose build backend
        #1 [internal] load local bake definitions
        #1 reading from stdin 593B 0.0s done
        #1 DONE 0.0s
        
        #2 [internal] load build definition from Dockerfile
        #2 transferring dockerfile: 30B 0.1s
        #2 transferring dockerfile: 971B 0.6s done
        #2 DONE 1.0s
        
        #3 [internal] load metadata for docker.io/library/node:20-alpine3.19
        #3 DONE 0.2s
        
        #4 [internal] load .dockerignore
        #4 transferring context: 69B 0.1s done
        #4 DONE 0.1s
        
        #5 [internal] load build context
        #5 DONE 0.0s
        
        #6 [ 1/11] FROM docker.io/library/node:20-alpine3.19@sha256:1cc9088b0fbcb2009a8fc2cb57916cd129cd5e32b3c75fb12bb24bac76917a96
        #6 resolve docker.io/library/node:20-alpine3.19@sha256:1cc9088b0fbcb2009a8fc2cb57916cd129cd5e32b3c75fb12bb24bac76917a96    
        #6 resolve docker.io/library/node:20-alpine3.19@sha256:1cc9088b0fbcb2009a8fc2cb57916cd129cd5e32b3c75fb12bb24bac76917a96 0.3s done
        #6 DONE 0.4s
        
        #5 [internal] load build context
        #5 transferring context: 13.13kB 1.5s done
        #5 DONE 1.5s
        
        #7 [ 2/11] RUN apk update && apk upgrade && apk add --no-cache sqlite python3 make g++ libc6-compat bash curl
        #7 CACHED
        
        #8 [ 3/11] WORKDIR /app
        #8 CACHED
        
        #9 [ 4/11] COPY package*.json ./
        #9 CACHED
        
        #10 [ 5/11] COPY knexfile.js ./
        #10 CACHED
        
        #11 [ 6/11] COPY knexfile.cjs ./
        #11 CACHED
        
        #12 [ 7/11] RUN npm install
        #12 CACHED
        
        #13 [ 8/11] COPY . .
        #13 DONE 0.8s
        
        #14 [ 9/11] RUN npm run build
        #14 6.566 
        #14 6.566 > ft_transcendence_backend@1.0.0 build
        #14 6.566 > tsc
        #14 6.566
        #14 53.94 src/server.mts(94,28): error TS2554: Expected 0 arguments, but got 2.
        #14 53.94 src/server.mts(274,27): error TS2554: Expected 0 arguments, but got 2.
        #14 53.94 src/server.mts(302,22): error TS2554: Expected 0 arguments, but got 2.
        #14 53.94 src/server.mts(337,20): error TS2554: Expected 0 arguments, but got 2.
        #14 53.94 src/server.mts(347,27): error TS2554: Expected 0 arguments, but got 2.
        #14 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
        ------
         > [ 9/11] RUN npm run build:
        6.566
        6.566 > ft_transcendence_backend@1.0.0 build
        6.566 > tsc
        6.566
        53.94 src/server.mts(94,28): error TS2554: Expected 0 arguments, but got 2.
        53.94 src/server.mts(274,27): error TS2554: Expected 0 arguments, but got 2.
        53.94 src/server.mts(302,22): error TS2554: Expected 0 arguments, but got 2.
        53.94 src/server.mts(337,20): error TS2554: Expected 0 arguments, but got 2.
        53.94 src/server.mts(347,27): error TS2554: Expected 0 arguments, but got 2.
        ------
        Dockerfile:20
        
        --------------------
        
          18 |
        
          19 |     # Build TypeScript code
        
          20 | >>> RUN npm run build
        
          21 |
        
          22 |     # Copy and set permissions for the entrypoint script
        
        --------------------
        
        failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
                if (!user.two_factor_secret) {
          request.log.warn('[LOGIN] Step 5: No 2FA secret found for user');
          return reply.status(401).send({ 
            error: '2FA not properly configured',
            requires2FA: true,
            message: '2FA is not properly configured. Please contact support.'
          });
        }
        const isValid2FA = TwoFactorAuthService.verifyToken(twoFactorToken, user.two_factor_secret);
        if (!isValid2FA) {
          request.log.warn('[LOGIN] Step 5: Invalid 2FA token');
          return reply.status(401).send({ 
            error: 'Invalid 2FA token',
            requires2FA: true,
            message: 'Invalid 2FA token. Please try again.'
          });
        }
        request.log.info('[LOGIN] Step 5: 2FA token valid');
      } else {
        request.log.info('[LOGIN] Step 5: 2FA not enabled');
      }
      
      // Step 6: Ensure user has an ID
      if (!user.id) {
        request.log.error('[LOGIN] Step 6: User ID not found');
        return reply.status(500).send({ error: 'User ID not found' });
      }
      request.log.info('[LOGIN] Step 6: User ID found');
      
      // Step 7: Update status
      request.log.info('[LOGIN] Step 7: Updating user status to online');
      await userRepository.update(user.id, { status: 'online' });
      request.log.info({ userId: user.id, username: user.username }, "[LOGIN] Step 7: Login successful, status updated");
      
      // Step 8: Create JWT token
      request.log.info('[LOGIN] Step 8: Creating JWT token');
      const token = jwt.sign(
        { id: user.id, username: user.username }, 
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      request.log.info('[LOGIN] Step 8: JWT token created');
      
      // Step 9: Set cookie
      request.log.info('[LOGIN] Step 9: Setting cookie');
      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true',
        sameSite: 'lax',
        maxAge: 86400 // 24 hours
      });
      request.log.info('[LOGIN] Step 9: Cookie set');
      
      // Step 10: Return user (without password) and token
      const { password_hash, ...userWithoutPassword } = user;
      request.log.info('[LOGIN] Step 10: Sending response');
      return reply.send({ 
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      request.log.error({ err: error, step: '[LOGIN] CATCH BLOCK' }, "[LOGIN] An unexpected error occurred during login");
      return reply.status(500).send({ error: 'Internal Server Error', details: error instanceof Error ? error.message : error });
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
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number };
          if (typeof decoded.id !== 'number') {
            throw new Error('Invalid user ID in token');
          }
          await userRepository.update(decoded.id, { status: 'offline' });
        } catch (err) {
          request.log.error({ err }, 'Token verification failed during logout');
        }
      }
      
      reply.clearCookie('token', { path: '/' });
      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      request.log.error({ err: error }, 'An unexpected error occurred during logout');
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