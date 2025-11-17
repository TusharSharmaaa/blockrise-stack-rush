import type { LoadNativeAdOptions, LoadNativeAdResult, NativeAdPlugin } from './nativeAd';

const PLACEHOLDER_AD: LoadNativeAdResult = {
  success: true,
  isPlaceholder: true,
  ad: {
    headline: 'Sponsored • Blockrise',
    body: 'Upgrade to Blockrise Pro and unlock weekly tournaments, premium skins, and 2x coins on every game session.',
    callToAction: 'Try Pro for Free',
    advertiser: 'Blockrise Studios',
    iconUrl: '/app-icon.png',
    imageUrls: ['/promo/premium-preview.png'],
    starRating: 4.9,
    extraLabel: 'Premium Offer',
  },
};

export class NativeAdWeb implements NativeAdPlugin {
  async loadAd(_options: LoadNativeAdOptions): Promise<LoadNativeAdResult> {
    return PLACEHOLDER_AD;
  }
}

