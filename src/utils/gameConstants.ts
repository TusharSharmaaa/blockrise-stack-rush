// Game configuration constants
export const GAME_CONSTANTS = {
  // Speed
  BASE_SPEED: 1000,
  SPEED_INCREASE_PER_LEVEL: 100,
  MIN_SPEED: 100,
  
  // Scoring
  POINTS_PER_LINE: 100,
  SCORE_PER_LEVEL: 1000,
  
  // Level
  MAX_LEVEL: 50,
  MIN_LEVEL: 1,
  
  // Grid
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  
  // Power-ups
  POWER_UP_DURATION: 30000, // 30 seconds
  SLOW_TIME_MULTIPLIER: 2, // Makes game 2x slower
  BOMB_RADIUS: 1, // 3x3 area (radius 1 from center)
  
  // Rewards
  WATCH_AD_COIN_REWARD: 50,
  DAILY_REWARD_BASE: 100,
  
  // Limits
  MAX_USERNAME_LENGTH: 20,
  MIN_USERNAME_LENGTH: 3,
  MAX_CITY_LENGTH: 50,
  MAX_COUNTRY_LENGTH: 50,
} as const;

export type GameConstants = typeof GAME_CONSTANTS;
