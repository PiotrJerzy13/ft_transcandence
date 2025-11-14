/**
 * Calculate player win rate percentage
 */
export const calculateWinRate = (wins: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
};

/**
 * Calculate average score per game
 */
export const calculateAverageScore = (totalScore: number, gamesPlayed: number): number => {
  if (gamesPlayed === 0) return 0;
  return Math.round(totalScore / gamesPlayed);
};

/**
 * Calculate player rating based on performance
 */
export const calculatePlayerRating = (
  wins: number,
  losses: number,
  totalScore: number,
  streakBonus: number = 0
): number => {
  const winBonus = wins * 25;
  const scoreBonus = Math.floor(totalScore / 100);
  const baseRating = winBonus + scoreBonus + streakBonus;
  
  return Math.max(0, baseRating);
};

/**
 * Calculate XP gained from a match
 */
export const calculateXPGain = (
  won: boolean,
  difficultyMultiplier: number,
  gameScore: number
): number => {
  const baseXP = won ? 100 : 25;
  const scoreXP = Math.floor(gameScore / 10);
  const totalXP = (baseXP + scoreXP) * difficultyMultiplier;
  
  return Math.round(totalXP);
};

/**
 * Calculate level from total XP
 */
export const getLevelFromXP = (totalXP: number): number => {
  // XP required per level increases by 500 each level
  // Level 1: 0-500 XP, Level 2: 500-1500 XP, etc.
  let level = 1;
  let xpNeeded = 500;
  let cumulativeXP = 0;

  while (cumulativeXP + xpNeeded <= totalXP) {
    cumulativeXP += xpNeeded;
    level += 1;
    xpNeeded += 500;
  }

  return level;
};

