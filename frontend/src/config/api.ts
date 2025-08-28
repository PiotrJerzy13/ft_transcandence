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
  PONG_HISTORY: `${API_BASE_URL}/api/pong/history`,
  ARKANOID_HISTORY: `${API_BASE_URL}/api/arkanoid/history`,
};
