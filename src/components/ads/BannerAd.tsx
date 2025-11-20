import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAdMob } from '@/hooks/useAdMob';
import { cn } from '@/lib/utils';

interface BannerAdProps {
  className?: string;
}

const isNative = Capacitor.isNativePlatform();
// Standard banner ad height is 50dp (Android) / 50pt (iOS)
// We'll reserve 60px to account for any margins/padding
const BANNER_HEIGHT = 60;

export const BannerAd = ({ className }: BannerAdProps) => {
  const { showBanner, hideBanner, isInitialized } = useAdMob();
  const bannerShownRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isNative) return;

    let isMounted = true;

    const displayBanner = async () => {
      // Don't show if already shown or component unmounted
      if (bannerShownRef.current || !isMounted) return;

      // Wait for initialization
      if (!isInitialized) {
        // Retry after a short delay
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            displayBanner();
          }
        }, 500);
        return;
      }

      // Try to show the banner
      try {
        console.log('[BannerAd] Attempting to show banner ad...');
        await showBanner();
        if (isMounted) {
          bannerShownRef.current = true;
          console.log('[BannerAd] Banner ad shown successfully');
        }
      } catch (error) {
        console.error('[BannerAd] Failed to show banner ad:', error);
        // Retry after error with exponential backoff
        if (isMounted && !bannerShownRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              displayBanner();
            }
          }, 2000);
        }
      }
    };

    // Initial attempt after a small delay
    const initialTimeout = setTimeout(() => {
      displayBanner();
    }, 1000);

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (initialTimeout) {
        clearTimeout(initialTimeout);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (isNative && bannerShownRef.current) {
        console.log('[BannerAd] Hiding banner ad on unmount');
        hideBanner().catch((error) => {
          console.error('[BannerAd] Failed to hide banner ad:', error);
        });
        bannerShownRef.current = false;
      }
    };
  }, [isNative, isInitialized, showBanner, hideBanner]);

  // Reserve space for the banner ad
  // This ensures content isn't hidden behind the fixed banner overlay
  return (
    <div
      className={cn('w-full', className)}
      style={{
        height: isNative ? `${BANNER_HEIGHT}px` : '0px',
        minHeight: isNative ? `${BANNER_HEIGHT}px` : '0px',
      }}
      aria-hidden="true"
    >
      {/* Space reserved for native banner ad overlay */}
      {/* The actual banner is rendered as a fixed overlay by AdMob at the bottom of the screen */}
      {process.env.NODE_ENV === 'development' && !isNative && (
        <div className="text-xs text-muted-foreground text-center py-2">
          [Debug] Banner Ad: Web platform detected. Banner ads only show on native builds.
        </div>
      )}
    </div>
  );
};

