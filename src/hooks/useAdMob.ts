import { useState, useEffect } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdPluginEvents, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// Test Ad Unit IDs for Android
const AD_UNITS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917'
};

export const useAdMob = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRewardedLoading, setIsRewardedLoading] = useState(false);
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);

  useEffect(() => {
    if (!isNative) return;

    const initialize = async () => {
      try {
        await AdMob.initialize({
          testingDevices: ['TEST_DEVICE_ID'],
          initializeForTesting: true
        });
        setIsInitialized(true);
      } catch (error) {
        console.error('AdMob initialization failed:', error);
      }
    };

    initialize();
  }, []);

  const showBanner = async () => {
    if (!isNative || !isInitialized) return;

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
