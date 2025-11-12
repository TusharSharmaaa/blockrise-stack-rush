import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface LevelProgress {
  currentLevel: number;
  unlockedLevels: number[];
  adsWatchedForNextLevel: number;
  adsRequiredPerLevel: number;
  totalCoins: number;
  dailyStreak: number;
  lastPlayedDate: string;
  hasClaimedDailyReward: boolean;
  totalGamesPlayed: number;
  highestScore: number;
}

const INITIAL_PROGRESS: LevelProgress = {
  currentLevel: 1,
  unlockedLevels: [1, 2, 3], // First 3 levels free
  adsWatchedForNextLevel: 0,
  adsRequiredPerLevel: 3,
  totalCoins: 100, // Starting bonus
  dailyStreak: 0,
  lastPlayedDate: new Date().toDateString(),
  hasClaimedDailyReward: false,
  totalGamesPlayed: 0,
  highestScore: 0
};

export const useGameProgress = () => {
  const [progress, setProgress] = useState<LevelProgress>(INITIAL_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { value } = await Preferences.get({ key: 'gameProgress' });
      if (value) {
        const savedProgress = JSON.parse(value);
        updateDailyStreak(savedProgress);
        setProgress(savedProgress);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (newProgress: LevelProgress) => {
    try {
      await Preferences.set({
        key: 'gameProgress',
        value: JSON.stringify(newProgress)
      });
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const updateDailyStreak = (savedProgress: LevelProgress) => {
    const today = new Date().toDateString();
    const lastPlayed = new Date(savedProgress.lastPlayedDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastPlayed.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      savedProgress.dailyStreak += 1;
      savedProgress.hasClaimedDailyReward = false;
    } else if (diffDays > 1) {
      savedProgress.dailyStreak = 0;
      savedProgress.hasClaimedDailyReward = false;
    }
    savedProgress.lastPlayedDate = today;
  };

  const watchAdForLevel = async () => {
    const newAdsWatched = progress.adsWatchedForNextLevel + 1;
    const nextLevel = progress.currentLevel + 1;

    if (newAdsWatched >= progress.adsRequiredPerLevel) {
      // Unlock next level
      const newProgress = {
        ...progress,
        unlockedLevels: [...progress.unlockedLevels, nextLevel],
        adsWatchedForNextLevel: 0,
        totalCoins: progress.totalCoins + 50 // Bonus coins for unlocking
      };
      await saveProgress(newProgress);
    } else {
      const newProgress = {
        ...progress,
        adsWatchedForNextLevel: newAdsWatched,
        totalCoins: progress.totalCoins + 10 // Small reward per ad
      };
      await saveProgress(newProgress);
    }
  };

  const selectLevel = async (level: number) => {
    if (progress.unlockedLevels.includes(level)) {
      await saveProgress({ ...progress, currentLevel: level });
    }
  };

  const addCoins = async (amount: number) => {
    await saveProgress({ ...progress, totalCoins: progress.totalCoins + amount });
  };

  const claimDailyReward = async () => {
    if (!progress.hasClaimedDailyReward) {
      const baseReward = 50;
      const streakBonus = progress.dailyStreak * 10;
      const totalReward = baseReward + streakBonus;

      await saveProgress({
        ...progress,
        totalCoins: progress.totalCoins + totalReward,
        hasClaimedDailyReward: true
      });
      return totalReward;
    }
    return 0;
  };

  const updateGameStats = async (score: number) => {
    const newProgress = {
      ...progress,
      totalGamesPlayed: progress.totalGamesPlayed + 1,
      highestScore: Math.max(progress.highestScore, score)
    };
    await saveProgress(newProgress);
  };

  const resetProgress = async () => {
    await saveProgress(INITIAL_PROGRESS);
  };

  return {
    progress,
    isLoading,
    watchAdForLevel,
    selectLevel,
    addCoins,
    claimDailyReward,
    updateGameStats,
    resetProgress
  };
};
