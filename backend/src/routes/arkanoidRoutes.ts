import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/index.js';

// Updated backend route to properly handle XP accumulation:

export default async function arkanoidRoutes(fastify: FastifyInstance) {
	// POST /arkanoid/score - Save score + xp
	fastify.post('/score', { preHandler: authenticate }, async (req, reply: FastifyReply) => {
	  console.log('[ARKANOID] Received score submission request');
	  const { score, levelReached, xpEarned, totalXp } = req.body as {
		score: number;
		levelReached: number;
		xpEarned: number;
		totalXp?: number;
	  };
	  const userId = req.user?.id;
	  console.log(`[ARKANOID] Score submission - user: ${userId}, score: ${score}, level: ${levelReached}, xpEarned: ${xpEarned}, totalXp: ${totalXp}`);
  
	  if (!userId || score == null || levelReached == null || xpEarned == null) {
		console.log('[ARKANOID] Invalid score submission - missing data');
		return reply.status(400).send({ error: 'Missing score, level or xp' });
	  }
  
	  try {
		const db = getDb();
  
		// Get current user stats
		const currentStats = await db.get(
		  `SELECT xp, level FROM user_stats WHERE user_id = ?`,
		  [userId]
		);
  
		// Calculate new total XP
		const currentTotalXp = currentStats?.xp || 0;
		const newTotalXp = totalXp || (currentTotalXp + xpEarned);
		const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;
  
		// Save game result
		await db.run(
		  `INSERT INTO arkanoid_scores (user_id, score, level_reached, xp, created_at)
		   VALUES (?, ?, ?, ?, datetime('now'))`,
		  [userId, score, levelReached, xpEarned] // Save XP earned this game
		);
  
		// Update user_stats table with new total XP
		await db.run(
		  `INSERT INTO user_stats (user_id, xp, level, total_games, wins, losses, win_streak, best_streak, total_play_time, rank, updated_at)
		   VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 'Novice', datetime('now'))
		   ON CONFLICT(user_id) DO UPDATE SET 
			 xp = ?,
			 level = ?,
			 updated_at = datetime('now')`,
		  [userId, newTotalXp, newLevel, newTotalXp, newLevel]
		);
  
		const updatedStats = await db.get(
		  `SELECT xp, level FROM user_stats WHERE user_id = ?`,
		  [userId]
		);
  
		console.log(`[ARKANOID] Score and XP saved successfully - New total XP: ${newTotalXp}, Level: ${newLevel}`);
		return reply.send({
		  success: true,
		  message: 'Score saved successfully',
		  userStats: updatedStats,
		});
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
		return reply.status(401).send({ error: 'User not authenticated' });
	  }
  
	  try {
		const db = getDb();
		const scores = await db.all(
		  `SELECT score, level_reached, xp, created_at 
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