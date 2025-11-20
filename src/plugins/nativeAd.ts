import { registerPlugin } from '@capacitor/core';

export interface NativeAdData {
  headline?: string;
  body?: string;
  advertiser?: string;
  callToAction?: string;
  iconUrl?: string;
  imageUrls?: string[];
  starRating?: number;
  store?: string;
  price?: string;
  extraLabel?: string;
}

export interface LoadNativeAdOptions {
  adUnitId: string;
}

export interface LoadNativeAdResult {
  success: boolean;
  ad?: NativeAdData;
  isPlaceholder?: boolean;
  errorMessage?: string;
}

export interface NativeAdPlugin {
  loadAd(options: LoadNativeAdOptions): Promise<LoadNativeAdResult>;
}

export const NativeAd = registerPlugin<NativeAdPlugin>('NativeAd', {
  web: () => import('./nativeAd.web').then(m => new m.NativeAdWeb()),
});

