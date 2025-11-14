export const TOURNAMENT_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 64,
  BRACKET_TYPES: ['single_elimination', 'double_elimination', 'round_robin'],
  DEFAULT_BRACKET_TYPE: 'single_elimination',
  AUTO_START_DELAY: 5000, // ms
  MATCH_TIMEOUT: 1800000, // 30 minutes
  RANKING_UPDATE_INTERVAL: 60000, // 1 minute
};

export const ACHIEVEMENT_TIERS = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

export const TOURNAMENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  FORFEITED: 'forfeited',
};

