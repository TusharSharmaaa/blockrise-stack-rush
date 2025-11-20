import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ADMOB_CONFIG } from '@/config/admob';
import { NativeAd, type NativeAdData } from '@/plugins/nativeAd';

interface UseNativeAdResult {
  ad: NativeAdData | null;
  isLoading: boolean;
  isPlaceholder: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isSupported: boolean;
}

const shouldUseNativeAd = () => Capacitor.isNativePlatform();

export const useNativeAd = (adUnitId: string = ADMOB_CONFIG.NATIVE_ID): UseNativeAdResult => {
  const [ad, setAd] = useState<NativeAdData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const isSupported = useMemo(() => shouldUseNativeAd(), []);

  const fetchAd = useCallback(async () => {
    if (!adUnitId) {
      setError('Missing native ad unit id');
      return;
    }

    // Check if we're on a native platform
    if (!isSupported) {
      // On web, show placeholder - this is handled by nativeAd.web.ts
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await NativeAd.loadAd({ adUnitId });
      if (!isMountedRef.current) return;

      if (result && result.success && result.ad) {
        setAd(result.ad);
        setIsPlaceholder(Boolean(result.isPlaceholder));
        setError(null);
      } else if (result && !result.success) {
        // Plugin returned an error result
        setError(result.errorMessage ?? 'Native ad unavailable. Please try again.');
      } else {
        // Unexpected result format
        setError('Native ad unavailable. Please try again.');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      let message = 'Failed to load native ad';
      if (err instanceof Error) {
        message = err.message;
        // Handle common Capacitor plugin errors
        if (message.includes('not implemented') || message.includes('not available') || message.includes('Unimplemented') || message.includes('UNAVAILABLE')) {
          message = 'Native ad plugin is not available. Please rebuild the Android app and ensure the plugin is properly registered.';
        } else if (message.includes('unavailable')) {
          message = 'Native ad unavailable. Please try again later.';
        } else {
          message = `Failed to load ad: ${message}`;
        }
      } else if (typeof err === 'string') {
        if (err.includes('not implemented') || err.includes('not available')) {
          message = 'Native ad plugin is not available. Please rebuild the Android app.';
        } else {
          message = err;
        }
      }
      setError(message);
      console.error('[useNativeAd] Error loading native ad:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [adUnitId, isSupported]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAd();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAd]);

  return {
    ad,
    isLoading,
    isPlaceholder,
    error,
    refresh: fetchAd,
    isSupported,
  };
};

