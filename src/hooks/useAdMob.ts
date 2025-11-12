import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdPluginEvents, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ADMOB_CONFIG } from '@/config/admob';

const isNative = Capacitor.isNativePlatform();

// Use test IDs from config (automatically switches based on environment)
const AD_UNITS = {
  banner: ADMOB_CONFIG.BANNER_ID,
  interstitial: ADMOB_CONFIG.INTERSTITIAL_ID,
  rewarded: ADMOB_CONFIG.REWARDED_ID
};

export const useAdMob = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRewardedLoading, setIsRewardedLoading] = useState(false);
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);

  const ensureInit = async () => {
    if (!isNative) return false;
    if (isInitialized) return true;
    try {
      await AdMob.initialize({
        testingDevices: ['TEST_DEVICE_ID'],
        initializeForTesting: true
      });
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error('AdMob initialization failed:', error);
      return false;
    }
  };

  const showBanner = async () => {
    if (!isNative) return;
    const ok = await ensureInit();
    if (!ok) return;

    try {
      const options: BannerAdOptions = {
        adId: AD_UNITS.banner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      };
      await AdMob.showBanner(options);
    } catch (error) {
      console.error('Show banner failed:', error);
    }
  };
  const hideBanner = async () => {
    if (!isNative || !isInitialized) return;

    try {
      await AdMob.hideBanner();
    } catch (error) {
      console.error('Hide banner failed:', error);
    }
  };

  const showInterstitial = async (): Promise<boolean> => {
    if (!isNative || !isInitialized) {
      // For web testing, simulate ad shown
      return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
    }

    try {
      setIsInterstitialLoading(true);
      await AdMob.prepareInterstitial({ adId: AD_UNITS.interstitial });
      await AdMob.showInterstitial();
      setIsInterstitialLoading(false);
      return true;
    } catch (error) {
      console.error('Show interstitial failed:', error);
      setIsInterstitialLoading(false);
      return false;
    }
  };

  const showRewardedAd = async (): Promise<{ success: boolean; reward?: AdMobRewardItem }> => {
    if (!isNative || !isInitialized) {
      // For web testing, simulate reward
      return new Promise((resolve) => 
        setTimeout(() => resolve({ 
          success: true, 
          reward: { type: 'coin', amount: 1 } 
        }), 1000)
      );
    }

    return new Promise(async (resolve) => {
      try {
        setIsRewardedLoading(true);

        const rewardListener = await AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          (reward: AdMobRewardItem) => {
            setIsRewardedLoading(false);
            rewardListener.remove();
            resolve({ success: true, reward });
          }
        );

        const dismissListener = await AdMob.addListener(
          RewardAdPluginEvents.Dismissed,
          () => {
            setIsRewardedLoading(false);
            dismissListener.remove();
            rewardListener.remove();
            resolve({ success: false });
          }
        );

        await AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded });
        await AdMob.showRewardVideoAd();
      } catch (error) {
        console.error('Show rewarded ad failed:', error);
        setIsRewardedLoading(false);
        resolve({ success: false });
      }
    });
  };

  return {
    isInitialized,
    isRewardedLoading,
    isInterstitialLoading,
    showBanner,
    hideBanner,
    showInterstitial,
    showRewardedAd
  };
};
