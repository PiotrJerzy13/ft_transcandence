export enum GameDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  EXTREME = 'extreme',
}

export enum PlayerRank {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  MASTER = 'master',
  LEGEND = 'legend',
}

export enum GameMode {
  PONG = 'pong',
  ARKANOID = 'arkanoid',
  TOURNAMENT = 'tournament',
}

export const DIFFICULTY_MULTIPLIER = {
  [GameDifficulty.EASY]: 0.5,
  [GameDifficulty.NORMAL]: 1.0,
  [GameDifficulty.HARD]: 1.5,
  [GameDifficulty.EXTREME]: 2.0,
};

