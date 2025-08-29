// API Configuration
export const API_BASE_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  PROFILE: `${API_BASE_URL}/api/user/me`,
  USER_PROFILE: `${API_BASE_URL}/api/user/profile`,
  TOURNAMENTS: `${API_BASE_URL}/api/tournaments`,
  TOURNAMENT_DETAIL: (id: number) => `${API_BASE_URL}/api/tournaments/${id}`,
  JOIN_TOURNAMENT: (id: number) => `${API_BASE_URL}/api/tournaments/${id}/join`,
  START_TOURNAMENT: (id: number) => `${API_BASE_URL}/api/tournaments/${id}/start`,
  DELETE_TOURNAMENT: (id: number) => `${API_BASE_URL}/api/tournaments/${id}`,
  UPDATE_MATCH_SCORE: (matchId: number) => `${API_BASE_URL}/api/matches/${matchId}/score`,
  PONG_HISTORY: `${API_BASE_URL}/api/pong/history`,
  ARKANOID_HISTORY: `${API_BASE_URL}/api/arkanoid/history`,
  // 2FA endpoints
  TWO_FACTOR_SETUP: `${API_BASE_URL}/api/2fa/setup`,
  TWO_FACTOR_VERIFY_SETUP: `${API_BASE_URL}/api/2fa/verify-setup`,
  TWO_FACTOR_DISABLE: `${API_BASE_URL}/api/2fa/disable`,
  TWO_FACTOR_STATUS: `${API_BASE_URL}/api/2fa/status`,
  TWO_FACTOR_BACKUP_CODES: `${API_BASE_URL}/api/2fa/backup-codes`,
  TWO_FACTOR_REGENERATE_BACKUP_CODES: `${API_BASE_URL}/api/2fa/regenerate-backup-codes`,
};
