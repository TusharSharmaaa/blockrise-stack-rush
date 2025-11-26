import type { 
  LoadNativeAdOptions, 
  LoadNativeAdResult, 
  NativeAdPlugin,
  PerformClickOptions,
  PerformClickResult,
  DestroyAdOptions,
  DestroyAdResult
} from './nativeAd';

const PLACEHOLDER_AD: LoadNativeAdResult = {
  success: true,
  isPlaceholder: true,
  ad: {
    adId: 'placeholder-web-ad',
    headline: 'Sponsored • Stack Boost',
    body: 'Watch a quick ad to earn bonus coins and unlock the next challenge faster.',
    callToAction: 'Watch & Earn',
    advertiser: 'Blockrise Rewards',
    iconUrl: '/app-icon.png',
    imageUrls: ['/placeholder.svg'],
    starRating: 4.9,
    extraLabel: 'Rewarded Ad',
  },
};

export class NativeAdWeb implements NativeAdPlugin {
  async loadAd(_options: LoadNativeAdOptions): Promise<LoadNativeAdResult> {
    return PLACEHOLDER_AD;
  }
  
  async performClick(_options: PerformClickOptions): Promise<PerformClickResult> {
    // On web, this is a placeholder - real ads only work on native
    return {
      success: false,
      errorMessage: 'Native ad clicks are only available on native platforms',
    };
  }
  
  async destroyAd(_options: DestroyAdOptions): Promise<DestroyAdResult> {
    // On web, nothing to destroy
    return { success: true };
  }
}

