// AdMob configuration for dev/staging and production
const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'staging';

export const ADMOB_CONFIG = {
  // Use test IDs in development/staging, real IDs in production
  BANNER_ID: IS_DEV 
    ? 'ca-app-pub-3940256099942544/6300978111' 
    : 'ca-app-pub-3940256099942544~3347511713',
  
  INTERSTITIAL_ID: IS_DEV 
    ? 'ca-app-pub-3940256099942544/1033173712' 
    : 'ca-app-pub-3940256099942544~3347511713',
  
  REWARDED_ID: IS_DEV 
    ? 'ca-app-pub-3940256099942544/5224354917' 
    : 'ca-app-pub-3940256099942544~3347511713',
  
  IS_DEV,
};

// Ad placement documentation for QA
export const AD_PLACEMENTS = {
  BANNER: 'Bottom of home screen',
  INTERSTITIAL_GAME_OVER: 'After game over',
  REWARDED_UNLOCK_LEVEL: 'When unlocking new level (watch 3 ads)',
} as const;
