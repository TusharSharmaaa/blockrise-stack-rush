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

    setIsLoading(true);
    try {
      const result = await NativeAd.loadAd({ adUnitId });
      if (!isMountedRef.current) return;

      if (result.success && result.ad) {
        setAd(result.ad);
        setIsPlaceholder(Boolean(result.isPlaceholder));
        setError(null);
      } else {
        setError(result.errorMessage ?? 'Native ad unavailable');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load native ad';
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [adUnitId]);

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

