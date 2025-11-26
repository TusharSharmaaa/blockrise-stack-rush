import { registerPlugin } from '@capacitor/core';

export interface NativeAdData {
  adId?: string; // Unique ID to reference the ad for click handling
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

export interface PerformClickOptions {
  adId: string;
}

export interface PerformClickResult {
  success: boolean;
  errorMessage?: string;
}

export interface DestroyAdOptions {
  adId: string;
}

export interface DestroyAdResult {
  success: boolean;
}

export interface NativeAdPlugin {
  loadAd(options: LoadNativeAdOptions): Promise<LoadNativeAdResult>;
  performClick(options: PerformClickOptions): Promise<PerformClickResult>;
  destroyAd(options: DestroyAdOptions): Promise<DestroyAdResult>;
}

export const NativeAd = registerPlugin<NativeAdPlugin>('NativeAd', {
  web: () => import('./nativeAd.web').then(m => new m.NativeAdWeb()),
});

