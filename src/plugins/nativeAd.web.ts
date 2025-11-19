import type { LoadNativeAdOptions, LoadNativeAdResult, NativeAdPlugin } from './nativeAd';

const PLACEHOLDER_AD: LoadNativeAdResult = {
  success: true,
  isPlaceholder: true,
  ad: {
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
}

