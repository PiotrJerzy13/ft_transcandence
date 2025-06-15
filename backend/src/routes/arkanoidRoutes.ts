import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';

export default async function arkanoidRoutes(fastify: FastifyInstance) {
  // POST /arkanoid/score - Save score
  fastify.post('/score', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
    console.log('[ARKANOID] Received score submission request');
    const { score, levelReached } = req.body as { score: number; levelReached: number };
    const userId = req.user?.id;
    console.log(`[ARKANOID] Score submission - user: ${userId}, score: ${score}, level: ${levelReached}`);

    if (!userId || score == null || levelReached == null) {
      console.log('[ARKANOID] Invalid score submission - missing data');
      return reply.status(400).send({ error: 'Missing score or level' });
    }

    try {
      const db = getDb();
      await db.run(
        `INSERT INTO arkanoid_scores (user_id, score, level_reached, created_at)
         VALUES (?, ?, ?, datetime('now'))`,
        [userId, score, levelReached]
      );
      console.log('[ARKANOID] Score saved successfully');
      return reply.send({ success: true, message: 'Score saved successfully' });
    } catch (error) {
      console.error('[ARKANOID] Error saving score:', error);
      return reply.status(500).send({ error: 'Failed to save score' });
    }
  });

  // GET /arkanoid/history - Fetch personal history
  fastify.get('/history', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
    console.log('[ARKANOID] Received history request');
    const userId = req.user?.id;
    console.log(`[ARKANOID] History request - user: ${userId}`);

    if (!userId) {
      console.log('[ARKANOID] Invalid history request - no user ID');
      return reply.status(401).send({ error: 'User not authenticated' });
    }

    try {
      const db = getDb();
      const scores = await db.all(
        `SELECT score, level_reached, created_at 
         FROM arkanoid_scores 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [userId]
      );
      console.log(`[ARKANOID] Found ${scores.length} scores for user ${userId}`);
      return reply.send({ history: scores });
    } catch (error) {
      console.error('[ARKANOID] Error fetching history:', error);
      return reply.status(500).send({ error: 'Failed to fetch history' });
    }
  });
}
