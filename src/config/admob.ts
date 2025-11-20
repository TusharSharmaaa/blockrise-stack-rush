// Production AdMob configuration
// Source: BlockRise app ad units (see provided AdMob screenshot)
export const ADMOB_CONFIG = {
  APP_OPEN_ID: 'ca-app-pub-2816806517862101/57352555017',
  BANNER_ID: 'ca-app-pub-2816806517862101/1440786782',
  INTERSTITIAL_ID: 'ca-app-pub-2816806517862101/6501541775',
  NATIVE_ID: 'ca-app-pub-2816806517862101/1282780789',
  REWARDED_ID: 'ca-app-pub-2816806517862101/7623051754',
  REWARDED_INTERSTITIAL_ID: 'ca-app-pub-2816806517862101/1403583174',
  IS_DEV: false,
} as const;

// Ad placement documentation for QA
export const AD_PLACEMENTS = {
  BANNER: 'Bottom of home screen',
  INTERSTITIAL_GAME_OVER: 'After game over (automatic)',
  REWARDED_UNLOCK_LEVEL: 'When unlocking new level (watch 3 ads)',
  REWARDED_FINISH_LEVEL: 'Watch ad to finish/complete a level when failed',
  REWARDED_EARN_MONEY: 'Watch ad to earn coins after game over',
  REWARDED_CONTINUE: 'Watch ad to continue playing after game over',
  APP_OPEN: 'Shown when app moves from background to foreground',
  REWARDED_INTERSTITIAL: 'High-value placement (e.g., continue run)',
} as const;
