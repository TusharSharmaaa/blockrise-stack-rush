import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setHapticsEnabled } from '@/utils/haptics';

type HapticsContextValue = {
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
  toggleVibration: () => void;
};

const STORAGE_KEY = 'settings.vibration-enabled';

const HapticsContext = createContext<HapticsContextValue | undefined>(undefined);

const getInitialPreference = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (storedValue === null) {
    return true;
  }

  return storedValue === 'true';
};

const persistPreference = (enabled: boolean) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  }
  setHapticsEnabled(enabled);
};

export const HapticsProvider = ({ children }: { children: ReactNode }) => {
  const [vibrationEnabled, setVibrationEnabledState] = useState<boolean>(getInitialPreference);

  useEffect(() => {
    persistPreference(vibrationEnabled);
  }, [vibrationEnabled]);

  const setVibrationEnabled = useCallback((enabled: boolean) => {
    setVibrationEnabledState(enabled);
  }, []);

  const toggleVibration = useCallback(() => {
    setVibrationEnabledState(prev => !prev);
  }, []);

  const value = useMemo<HapticsContextValue>(() => ({
    vibrationEnabled,
    setVibrationEnabled,
    toggleVibration,
  }), [vibrationEnabled, setVibrationEnabled, toggleVibration]);

  return (
    <HapticsContext.Provider value={value}>
      {children}
    </HapticsContext.Provider>
  );
};

export const useHaptics = () => {
  const context = useContext(HapticsContext);
  if (!context) {
    throw new Error('useHaptics must be used within a HapticsProvider');
  }
  return context;
};

