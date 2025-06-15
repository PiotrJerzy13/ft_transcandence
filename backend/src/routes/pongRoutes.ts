import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';

export default async function pongRoutes(fastify: FastifyInstance) {
  // POST /pong/score - Save a completed pong match
  fastify.post('/score', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
    console.log('[PONG] Received score submission request');

    const { mode, score, opponentScore, winner } = req.body as {
      mode: 'one-player' | 'two-player';
      score: number;
      opponentScore: number;
      winner: 'player' | 'opponent';
    };
    const userId = req.user?.id;

    if (!userId || score == null || opponentScore == null || !winner || !mode) {
      console.log('[PONG] Invalid score submission - missing data');
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    try {
      const db = getDb();
      await db.run(
        `INSERT INTO pong_matches (user_id, mode, score, opponent_score, winner, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [userId, mode, score, opponentScore, winner]
      );
      console.log('[PONG] Score saved successfully');
      return reply.send({ success: true, message: 'Score saved successfully' });
    } catch (error) {
      console.error('[PONG] Error saving score:', error);
      return reply.status(500).send({ error: 'Failed to save score' });
    }
  });

  // GET /pong/history - Fetch personal Pong match history
  fastify.get('/history', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
    console.log('[PONG] Received history request');
    const userId = req.user?.id;

    if (!userId) {
      console.log('[PONG] Invalid history request - no user ID');
      return reply.status(401).send({ error: 'User not authenticated' });
    }

    try {
      const db = getDb();
      const history = await db.all(
        `SELECT mode, score, opponent_score, winner, created_at
         FROM pong_matches
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );
      console.log(`[PONG] Found ${history.length} matches for user ${userId}`);
      return reply.send({ history });
    } catch (error) {
      console.error('[PONG] Error fetching history:', error);
      return reply.status(500).send({ error: 'Failed to fetch history' });
    }
  });
}
