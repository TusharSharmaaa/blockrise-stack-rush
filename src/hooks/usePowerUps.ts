import { useState, useCallback, useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface PowerUpInventory {
  slowTime: number;
  clearLine: number;
  shuffle: number;
  bomb: number;
}

export interface ActivePowerUp {
  type: keyof PowerUpInventory;
  duration: number;
  startTime: number;
}

type ActivePowerUpMap = Partial<Record<keyof PowerUpInventory, ActivePowerUp>>;

const INITIAL_INVENTORY: PowerUpInventory = {
  slowTime: 0,
  clearLine: 0,
  shuffle: 0,
  bomb: 0
};

export const usePowerUps = () => {
  const [inventory, setInventory] = useState<PowerUpInventory>(INITIAL_INVENTORY);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUpMap>({});
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedulePowerUpExpiration = useCallback((type: keyof PowerUpInventory, duration: number, startTime: number) => {
    if (typeof window === 'undefined') return;

    const timeoutId = window.setTimeout(() => {
      setActivePowerUps(prev => {
        const current = prev[type];
        if (!current || current.startTime !== startTime) {
          return prev;
        }
        const { [type]: _, ...rest } = prev;
        return rest;
      });
    }, duration);

    timeoutRefs.current.push(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: 'powerUpInventory' });
      if (value) {
        const parsed = JSON.parse(value);
        setInventory(parsed);
      } else {
        // If no inventory exists, initialize with default
        setInventory(INITIAL_INVENTORY);
      }
    } catch (error) {
      console.error('Failed to load power-up inventory:', error);
      setInventory(INITIAL_INVENTORY);
    }
  }, []);

  const saveInventory = useCallback(async (newInventory: PowerUpInventory) => {
    // Update state immediately (synchronously) for UI responsiveness
    setInventory(newInventory);
    try {
      await Preferences.set({
        key: 'powerUpInventory',
        value: JSON.stringify(newInventory)
      });
      // Dispatch custom event to notify other components of inventory change
      window.dispatchEvent(new CustomEvent('powerUpInventoryChanged', { detail: newInventory }));
    } catch (error) {
      console.error('Failed to save power-up inventory:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    loadInventory();

    const handleInventoryChange = (event: Event) => {
      const customEvent = event as CustomEvent<PowerUpInventory>;
      if (customEvent.detail) {
        setInventory(customEvent.detail);
      } else {
        loadInventory();
      }
    };

    window.addEventListener('powerUpInventoryChanged', handleInventoryChange);
    return () => {
      window.removeEventListener('powerUpInventoryChanged', handleInventoryChange);
    };
  }, [loadInventory]);

  const addPowerUp = useCallback(async (type: keyof PowerUpInventory, amount: number = 1) => {
    // Reload inventory first to ensure we have the latest state
    try {
      const { value } = await Preferences.get({ key: 'powerUpInventory' });
      const currentInventory = value ? JSON.parse(value) : INITIAL_INVENTORY;
      
      const newInventory = {
        ...currentInventory,
        [type]: (currentInventory[type] || 0) + amount
      };
      await saveInventory(newInventory);
    } catch (error) {
      console.error('Failed to add power-up:', error);
      // Fallback to using state if Preferences fails
      const newInventory = {
        ...inventory,
        [type]: (inventory[type] || 0) + amount
      };
      await saveInventory(newInventory);
    }
  }, [inventory, saveInventory]);

  const usePowerUp = useCallback(async (type: keyof PowerUpInventory, duration: number = 30000): Promise<boolean> => {
    // Reload inventory first to ensure we have the latest state
    try {
      const { value } = await Preferences.get({ key: 'powerUpInventory' });
      const currentInventory = value ? JSON.parse(value) : INITIAL_INVENTORY;
      
      if (currentInventory[type] <= 0) {
        return false;
      }

      const newInventory = {
        ...currentInventory,
        [type]: currentInventory[type] - 1
      };
      await saveInventory(newInventory);

      const startTime = Date.now();
      const instance: ActivePowerUp = {
        type,
        duration,
        startTime
      };
      setActivePowerUps(prev => ({
        ...prev,
        [type]: instance
      }));

      schedulePowerUpExpiration(type, duration, startTime);

      return true;
    } catch (error) {
      console.error('Failed to use power-up:', error);
      // Fallback to using state if Preferences fails
      if (inventory[type] <= 0) {
        return false;
      }

      const newInventory = {
        ...inventory,
        [type]: inventory[type] - 1
      };
      await saveInventory(newInventory);

      const startTime = Date.now();
      const instance: ActivePowerUp = {
        type,
        duration,
        startTime
      };
      setActivePowerUps(prev => ({
        ...prev,
        [type]: instance
      }));

      schedulePowerUpExpiration(type, duration, startTime);

      return true;
    }
  }, [inventory, saveInventory, schedulePowerUpExpiration]);

  const clearActivePowerUp = useCallback(() => {
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current = [];
    setActivePowerUps({});
  }, []);

  const hasPowerUp = useCallback((type: keyof PowerUpInventory): boolean => {
    return inventory[type] > 0;
  }, [inventory]);

  const isActive = useCallback((type: keyof PowerUpInventory): boolean => {
    return Boolean(activePowerUps[type]);
  }, [activePowerUps]);

  const getRemainingTime = useCallback((type: keyof PowerUpInventory): number => {
    const activePowerUp = activePowerUps[type];
    if (!activePowerUp) return 0;
    const elapsed = Date.now() - activePowerUp.startTime;
    return Math.max(0, activePowerUp.duration - elapsed);
  }, [activePowerUps]);

  return {
    inventory,
    activePowerUps,
    loadInventory,
    addPowerUp,
    usePowerUp,
    clearActivePowerUp,
    hasPowerUp,
    isActive,
    getRemainingTime
  };
};
