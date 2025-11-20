import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, RewardAdPluginEvents, AdMobRewardItem, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { useState, useEffect, useCallback } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { ADMOB_CONFIG } from '@/config/admob';

const isNative = Capacitor.isNativePlatform();

// Use test IDs from config (automatically switches based on environment)
const AD_UNITS = {
  banner: ADMOB_CONFIG.BANNER_ID,
  interstitial: ADMOB_CONFIG.INTERSTITIAL_ID,
  rewarded: ADMOB_CONFIG.REWARDED_ID
};

// Global state for ad preloading
// Note: These are module-level variables shared across all hook instances
// This is intentional for ad preloading efficiency - only one instance should exist per app
let isInitialized = false;
let isInterstitialReady = false;
let isRewardedReady = false;
let interstitialDismissListener: PluginListenerHandle | undefined;
let rewardedDismissListener: PluginListenerHandle | undefined;

export const useAdMob = () => {
  const [isRewardedLoading, setIsRewardedLoading] = useState(false);
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);
  const [initialized, setInitialized] = useState(isInitialized);

  const preloadInterstitial = useCallback(async () => {
    if (!isNative || !isInitialized) return;
    if (isInterstitialReady) return;

    try {
      // Setup dismiss listener once
      if (!interstitialDismissListener) {
        interstitialDismissListener = await AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          () => {
            isInterstitialReady = false;
            // Immediately preload next interstitial (don't await to avoid blocking)
            preloadInterstitial().catch(err => console.error('Failed to preload interstitial after dismiss:', err));
          }
        );
      }

      await AdMob.prepareInterstitial({ adId: AD_UNITS.interstitial });
      isInterstitialReady = true;
    } catch (error) {
      console.error('Preload interstitial failed:', error);
      isInterstitialReady = false;
    }
  }, []);

  const preloadRewarded = useCallback(async () => {
    if (!isNative || !isInitialized) return;
    if (isRewardedReady) return;

    try {
      await AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded });
      isRewardedReady = true;
    } catch (error) {
      console.error('Preload rewarded failed:', error);
      isRewardedReady = false;
    }
  }, []);

  // Initialize AdMob on mount and preload ads
  useEffect(() => {
    if (!isNative) return;

    const initAndPreload = async () => {
      if (isInitialized) {
        setInitialized(true);
        return;
      }

      try {
        await AdMob.initialize({
          testingDevices: ['TEST_DEVICE_ID'],
          initializeForTesting: true
        });
        isInitialized = true;
        setInitialized(true);

        // Preload interstitial ad immediately
        preloadInterstitial();
        
        // Preload rewarded ad immediately
        preloadRewarded();
      } catch (error) {
        console.error('AdMob initialization failed:', error);
      }
    };

    initAndPreload();
  }, [preloadInterstitial, preloadRewarded]);

  const showBanner = async () => {
    if (!isNative) {
      console.log('[useAdMob] showBanner: Not native platform, skipping');
      return;
    }
    
    if (!isInitialized) {
      console.log('[useAdMob] showBanner: AdMob not initialized yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isInitialized) {
        console.error('[useAdMob] showBanner: AdMob still not initialized');
        return;
      }
    }

    try {
      // Hide any existing banner first to avoid conflicts
      try {
        await AdMob.hideBanner();
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        // Ignore error if banner doesn't exist
        console.log('[useAdMob] showBanner: No existing banner to hide');
      }

      const options: BannerAdOptions = {
        adId: AD_UNITS.banner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      };
      
      console.log('[useAdMob] showBanner: Showing banner with options:', options);
      await AdMob.showBanner(options);
      console.log('[useAdMob] showBanner: Banner shown successfully');
    } catch (error) {
      console.error('[useAdMob] showBanner: Failed to show banner:', error);
      throw error; // Re-throw to allow component to handle retry
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
    if (!isNative) {
      // For web testing, simulate ad shown immediately
      return true;
    }

    if (!isInitialized) {
      // Try to initialize quickly
      try {
        await AdMob.initialize({
          testingDevices: ['TEST_DEVICE_ID'],
          initializeForTesting: true
        });
        isInitialized = true;
        setInitialized(true);
      } catch (error) {
        console.error('AdMob initialization failed:', error);
        return false;
      }
    }

    try {
      // If ad is ready, show immediately
      if (isInterstitialReady) {
        setIsInterstitialLoading(true);
        await AdMob.showInterstitial();
        isInterstitialReady = false;
        setIsInterstitialLoading(false);
        // Preload next ad immediately (don't await to avoid blocking)
        preloadInterstitial().catch(err => console.error('Failed to preload interstitial after show:', err));
        return true;
      }

      // If not ready, prepare and show immediately (fallback)
      setIsInterstitialLoading(true);
      
      // Setup dismiss listener if not already set
      if (!interstitialDismissListener) {
        interstitialDismissListener = await AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          () => {
            isInterstitialReady = false;
            setIsInterstitialLoading(false);
            // Immediately preload next interstitial (don't await to avoid blocking)
            preloadInterstitial().catch(err => console.error('Failed to preload interstitial after dismiss:', err));
          }
        );
      }

      await AdMob.prepareInterstitial({ adId: AD_UNITS.interstitial });
      await AdMob.showInterstitial();
      isInterstitialReady = false;
      setIsInterstitialLoading(false);
      
      // Preload next ad immediately (don't await to avoid blocking)
      preloadInterstitial().catch(err => console.error('Failed to preload interstitial after show:', err));
      return true;
    } catch (error) {
      console.error('Show interstitial failed:', error);
      setIsInterstitialLoading(false);
      isInterstitialReady = false;
      // Try to preload for next time (don't await to avoid blocking)
      preloadInterstitial().catch(err => console.error('Failed to preload interstitial after error:', err));
      return false;
    }
  };

  const showRewardedAd = async (): Promise<{ success: boolean; reward?: AdMobRewardItem }> => {
    if (!isNative) {
      // For web testing, simulate reward immediately
      return { success: true, reward: { type: 'coin', amount: 1 } };
    }

    if (!isInitialized) {
      // Try to initialize quickly
      try {
        await AdMob.initialize({
          testingDevices: ['TEST_DEVICE_ID'],
          initializeForTesting: true
        });
        isInitialized = true;
        setInitialized(true);
      } catch (error) {
        console.error('AdMob initialization failed:', error);
        return { success: false };
      }
    }

    return new Promise((resolve) => {
      const run = async () => {
      let rewardListener: PluginListenerHandle | undefined;
      let dismissListener: PluginListenerHandle | undefined;
      let rewardEarned: AdMobRewardItem | null = null;

      const cleanup = () => {
        rewardListener?.remove();
        dismissListener?.remove();
        rewardListener = undefined;
        dismissListener = undefined;
      };

        try {
          setIsRewardedLoading(true);

          rewardListener = await AdMob.addListener(
            RewardAdPluginEvents.Rewarded,
            (reward: AdMobRewardItem) => {
              rewardEarned = reward;
            }
          );

          dismissListener = await AdMob.addListener(
            RewardAdPluginEvents.Dismissed,
            () => {
              setIsRewardedLoading(false);
              isRewardedReady = false;
              cleanup();

              if (rewardEarned) {
                resolve({ success: true, reward: rewardEarned });
              } else {
                resolve({ success: false });
              }
              
              // Immediately preload next rewarded ad (don't await to avoid blocking)
              preloadRewarded().catch(err => console.error('Failed to preload rewarded after dismiss:', err));
            }
          );

          // If ad is ready, show immediately
          if (isRewardedReady) {
            await AdMob.showRewardVideoAd();
            isRewardedReady = false;
            return; // Listener will handle cleanup
          }

          // If not ready, prepare and show immediately
          await AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded });
          await AdMob.showRewardVideoAd();
          isRewardedReady = false;
        } catch (error) {
          console.error('Show rewarded ad failed:', error);
          setIsRewardedLoading(false);
          isRewardedReady = false;
          cleanup();
          resolve({ success: false });
          // Try to preload for next time (don't await to avoid blocking)
          preloadRewarded().catch(err => console.error('Failed to preload rewarded after error:', err));
        }
      };

      run();
    });
  };

  return {
    isInitialized: initialized,
    isRewardedLoading,
    isInterstitialLoading,
    showBanner,
    hideBanner,
    showInterstitial,
    showRewardedAd,
    preloadInterstitial,
    preloadRewarded
  };
};
