import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

export const usePremium = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      const { value } = await Preferences.get({ key: 'adsRemoved' });
      setIsPremium(value === 'true');
    } catch (error) {
      console.error('Failed to load premium status:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setPremiumStatus = async (status: boolean) => {
    setIsPremium(status);
    try {
      await Preferences.set({
        key: 'adsRemoved',
        value: status.toString()
      });
    } catch (error) {
      console.error('Failed to save premium status:', error);
    }
  };

  return {
    isPremium,
    isLoading,
    setPremiumStatus
  };
};

