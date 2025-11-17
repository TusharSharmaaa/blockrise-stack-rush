// AdMob configuration - Using test ad unit IDs
// Google Test Ad Unit IDs for development and testing
export const ADMOB_CONFIG = {
  // Test Banner Ad Unit ID
  BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',
  
  // Test Native Advanced Ad Unit ID
  NATIVE_ID: 'ca-app-pub-3940256099942544/2247696110',
  
  // Test Interstitial Ad Unit ID
  INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',
  
  // Test Rewarded Ad Unit ID
  REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917',
  
  IS_DEV: true,
};

// Ad placement documentation for QA
export const AD_PLACEMENTS = {
  BANNER: 'Bottom of home screen',
  INTERSTITIAL_GAME_OVER: 'After game over (automatic)',
  REWARDED_UNLOCK_LEVEL: 'When unlocking new level (watch 3 ads)',
  REWARDED_FINISH_LEVEL: 'Watch ad to finish/complete a level when failed',
  REWARDED_EARN_MONEY: 'Watch ad to earn coins after game over',
  REWARDED_CONTINUE: 'Watch ad to continue playing after game over',
} as const;
