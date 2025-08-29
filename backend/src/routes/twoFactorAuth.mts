import { FastifyInstance, FastifyReply } from 'fastify';
import { TwoFactorAuthService } from '../services/twoFactorAuth.mjs';
import { getDb } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from './error.js';

export default async function twoFactorAuthRoutes(fastify: FastifyInstance) {
  // Generate 2FA setup (secret, QR code, backup codes)
  fastify.post('/2fa/setup', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const { username } = request.body as { username: string };
    const db = getDb();

    // Check if user already has 2FA enabled
    const user = await db('users')
      .select('two_factor_enabled')
      .where('id', userId)
      .first();

    if (user?.two_factor_enabled) {
      throw new BadRequestError('2FA is already enabled for this account');
    }

    // Generate 2FA setup
    const setup = await TwoFactorAuthService.generateSecret(username);

    // Store the secret temporarily (will be confirmed when user verifies)
    await db('users')
      .where('id', userId)
      .update({
        two_factor_secret: setup.secret,
        backup_codes: JSON.stringify(setup.backupCodes)
      });

    return reply.send({
      success: true,
      message: '2FA setup generated successfully',
      data: {
        qrCodeUrl: setup.qrCodeUrl,
        backupCodes: TwoFactorAuthService.formatBackupCodes(setup.backupCodes),
        secret: setup.secret // For manual entry if needed
      }
    });
  });

  // Verify and enable 2FA
  fastify.post('/2fa/verify-setup', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 6, maxLength: 6 }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const { token } = request.body as { token: string };
    const db = getDb();

    // Get user's temporary secret
    const user = await db('users')
      .select('two_factor_secret')
      .where('id', userId)
      .first();

    if (!user?.two_factor_secret) {
      throw new BadRequestError('No 2FA setup found. Please generate setup first.');
    }

    // Verify the token
    const isValid = TwoFactorAuthService.verifyToken(token, user.two_factor_secret);

    if (!isValid) {
      throw new BadRequestError('Invalid 2FA token. Please try again.');
    }

    // Enable 2FA
    await db('users')
      .where('id', userId)
      .update({
        two_factor_enabled: true,
        two_factor_setup_at: new Date().toISOString()
      });

    return reply.send({
      success: true,
      message: '2FA enabled successfully'
    });
  });

  // Disable 2FA
  fastify.post('/2fa/disable', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 6, maxLength: 6 }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const { token } = request.body as { token: string };
    const db = getDb();

    // Get user's 2FA secret
    const user = await db('users')
      .select('two_factor_secret', 'two_factor_enabled')
      .where('id', userId)
      .first();

    if (!user?.two_factor_enabled) {
      throw new BadRequestError('2FA is not enabled for this account');
    }

    // Verify the token
    const isValid = TwoFactorAuthService.verifyToken(token, user.two_factor_secret);

    if (!isValid) {
      throw new BadRequestError('Invalid 2FA token. Please try again.');
    }

    // Disable 2FA
    await db('users')
      .where('id', userId)
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: null,
        two_factor_setup_at: null
      });

    return reply.send({
      success: true,
      message: '2FA disabled successfully'
    });
  });

  // Get 2FA status
  fastify.get('/2fa/status', {
    preHandler: authenticate
  }, async (request, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    const user = await db('users')
      .select('two_factor_enabled', 'backup_codes')
      .where('id', userId)
      .first();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return reply.send({
      success: true,
      data: {
        enabled: user.two_factor_enabled,
        hasBackupCodes: !!user.backup_codes,
        backupCodesCount: user.backup_codes ? JSON.parse(user.backup_codes).length : 0
      }
    });
  });

  // Get backup codes (only if 2FA is enabled)
  fastify.get('/2fa/backup-codes', {
    preHandler: authenticate
  }, async (request, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const db = getDb();
    const user = await db('users')
      .select('two_factor_enabled', 'backup_codes')
      .where('id', userId)
      .first();

    if (!user?.two_factor_enabled) {
      throw new BadRequestError('2FA is not enabled for this account');
    }

    if (!user.backup_codes) {
      throw new BadRequestError('No backup codes found');
    }

    const backupCodes = JSON.parse(user.backup_codes);
    const formattedCodes = TwoFactorAuthService.formatBackupCodes(backupCodes);

    return reply.send({
      success: true,
      data: {
        backupCodes: formattedCodes
      }
    });
  });

  // Regenerate backup codes
  fastify.post('/2fa/regenerate-backup-codes', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 6, maxLength: 6 }
        }
      }
    }
  }, async (request, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const { token } = request.body as { token: string };
    const db = getDb();

    // Get user's 2FA secret
    const user = await db('users')
      .select('two_factor_secret', 'two_factor_enabled')
      .where('id', userId)
      .first();

    if (!user?.two_factor_enabled) {
      throw new BadRequestError('2FA is not enabled for this account');
    }

    // Verify the token
    const isValid = TwoFactorAuthService.verifyToken(token, user.two_factor_secret);

    if (!isValid) {
      throw new BadRequestError('Invalid 2FA token. Please try again.');
    }

    // Generate new backup codes
    const backupCodes = TwoFactorAuthService['generateBackupCodes']();

    // Update user with new backup codes
    await db('users')
      .where('id', userId)
      .update({
        backup_codes: JSON.stringify(backupCodes)
      });

    const formattedCodes = TwoFactorAuthService.formatBackupCodes(backupCodes);

    return reply.send({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes: formattedCodes
      }
    });
  });
}
