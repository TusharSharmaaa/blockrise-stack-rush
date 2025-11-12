import { useState, useCallback } from 'react';
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

const INITIAL_INVENTORY: PowerUpInventory = {
  slowTime: 0,
  clearLine: 0,
  shuffle: 0,
  bomb: 0
};

export const usePowerUps = () => {
  const [inventory, setInventory] = useState<PowerUpInventory>(INITIAL_INVENTORY);
  const [activePowerUp, setActivePowerUp] = useState<ActivePowerUp | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: 'powerUpInventory' });
      if (value) {
        setInventory(JSON.parse(value));
      }
    } catch (error) {
      console.error('Failed to load power-up inventory:', error);
    }
  }, []);

  const saveInventory = useCallback(async (newInventory: PowerUpInventory) => {
    try {
      await Preferences.set({
        key: 'powerUpInventory',
        value: JSON.stringify(newInventory)
      });
      setInventory(newInventory);
    } catch (error) {
      console.error('Failed to save power-up inventory:', error);
    }
  }, []);

  const addPowerUp = useCallback(async (type: keyof PowerUpInventory, amount: number = 1) => {
    const newInventory = {
      ...inventory,
      [type]: inventory[type] + amount
    };
    await saveInventory(newInventory);
  }, [inventory, saveInventory]);

  const usePowerUp = useCallback(async (type: keyof PowerUpInventory, duration: number = 30000): Promise<boolean> => {
    if (inventory[type] <= 0) {
      return false;
    }

    if (activePowerUp) {
      return false; // Can't use power-up while another is active
    }

    const newInventory = {
      ...inventory,
      [type]: inventory[type] - 1
    };
    await saveInventory(newInventory);

    setActivePowerUp({
      type,
      duration,
      startTime: Date.now()
    });

    // Auto-deactivate after duration
    setTimeout(() => {
      setActivePowerUp(null);
    }, duration);

    return true;
  }, [inventory, activePowerUp, saveInventory]);

  const clearActivePowerUp = useCallback(() => {
    setActivePowerUp(null);
  }, []);

  const hasPowerUp = useCallback((type: keyof PowerUpInventory): boolean => {
    return inventory[type] > 0;
  }, [inventory]);

  const isActive = useCallback((type: keyof PowerUpInventory): boolean => {
    return activePowerUp?.type === type;
  }, [activePowerUp]);

  const getRemainingTime = useCallback((): number => {
    if (!activePowerUp) return 0;
    const elapsed = Date.now() - activePowerUp.startTime;
    return Math.max(0, activePowerUp.duration - elapsed);
  }, [activePowerUp]);

  return {
    inventory,
    activePowerUp,
    loadInventory,
    addPowerUp,
    usePowerUp,
    clearActivePowerUp,
    hasPowerUp,
    isActive,
    getRemainingTime
  };
};
