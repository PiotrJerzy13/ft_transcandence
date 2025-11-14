/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username format (3-20 chars, alphanumeric + underscore)
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Validate tournament name
 */
export const isValidTournamentName = (name: string): boolean => {
  return name.length >= 3 && name.length <= 50;
};

/**
 * Validate score value
 */
export const isValidScore = (score: any): boolean => {
  return typeof score === 'number' && score >= 0 && Number.isInteger(score);
};

/**
 * Validate player count for tournament
 */
export const isValidPlayerCount = (count: number): boolean => {
  return count >= 2 && count <= 64;
};

