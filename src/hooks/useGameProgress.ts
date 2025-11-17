import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

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
  lastAdWatchDate: string;
  adsWatchedToday: number;
  maxAdsPerDay: number;
  levelScores: { [level: number]: number };
  totalAdsWatched: number;
}

const INITIAL_PROGRESS: LevelProgress = {
  currentLevel: 1,
  unlockedLevels: [1, 2, 3, 4, 5], // First 5 levels free
  adsWatchedForNextLevel: 0,
  adsRequiredPerLevel: 3,
  totalCoins: 100, // Starting bonus
  dailyStreak: 0,
  lastPlayedDate: new Date().toDateString(),
  hasClaimedDailyReward: false,
  totalGamesPlayed: 0,
  highestScore: 0,
  lastAdWatchDate: new Date().toDateString(),
  adsWatchedToday: 0,
  maxAdsPerDay: 10,
  levelScores: {},
  totalAdsWatched: 0
};

// Level progression system - score required to complete each level
export const LEVEL_REQUIREMENTS = {
  1: 500,
  2: 800,
  3: 1200,
  4: 1800,
  5: 2500,
  10: 5000,
  15: 8000,
  20: 12000,
  25: 18000,
  30: 25000,
  40: 40000,
  50: 60000,
};

export const getScoreRequirement = (level: number): number => {
  if (LEVEL_REQUIREMENTS[level as keyof typeof LEVEL_REQUIREMENTS]) {
    return LEVEL_REQUIREMENTS[level as keyof typeof LEVEL_REQUIREMENTS];
  }
  // Dynamic calculation for levels not in the map
  return Math.floor(500 + (level * level * 50));
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

  const canWatchAdToday = () => {
    const today = new Date().toDateString();
    if (progress.lastAdWatchDate !== today) {
      return true; // New day, can watch ads
    }
    return progress.adsWatchedToday < progress.maxAdsPerDay;
  };

  const watchAdForLevel = async () => {
    const today = new Date().toDateString();
    
    // Reset daily counter if new day
    if (progress.lastAdWatchDate !== today) {
      progress.adsWatchedToday = 0;
      progress.lastAdWatchDate = today;
    }

    if (progress.adsWatchedToday >= progress.maxAdsPerDay) {
      return { success: false, message: 'Daily ad limit reached. Come back tomorrow!' };
    }

    const newAdsWatched = progress.adsWatchedForNextLevel + 1;
    const nextLevel = Math.max(...progress.unlockedLevels) + 1;

    if (newAdsWatched >= progress.adsRequiredPerLevel) {
      // Unlock next level
      const newProgress = {
        ...progress,
        unlockedLevels: [...progress.unlockedLevels, nextLevel],
        adsWatchedForNextLevel: 0,
        totalCoins: progress.totalCoins + 50,
        adsWatchedToday: progress.adsWatchedToday + 1,
        lastAdWatchDate: today,
        totalAdsWatched: progress.totalAdsWatched + 1
      };
      await saveProgress(newProgress);
      return { success: true, levelUnlocked: true, level: nextLevel };
    } else {
      const newProgress = {
        ...progress,
        adsWatchedForNextLevel: newAdsWatched,
        totalCoins: progress.totalCoins + 10,
        adsWatchedToday: progress.adsWatchedToday + 1,
        lastAdWatchDate: today,
        totalAdsWatched: progress.totalAdsWatched + 1
      };
      await saveProgress(newProgress);
      return { success: true, levelUnlocked: false };
    }
  };

  const selectLevel = async (level: number) => {
    if (progress.unlockedLevels.includes(level)) {
      const newProgress = { ...progress, currentLevel: level };
      await saveProgress(newProgress);
      await syncProgressToBackend(newProgress);
    }
  };

  const unlockLevel = async (level: number) => {
    if (level < 1 || level > 50) return;
    if (progress.unlockedLevels.includes(level)) return; // Already unlocked
    
    const newProgress = {
      ...progress,
      unlockedLevels: [...progress.unlockedLevels, level].sort((a, b) => a - b)
    };
    await saveProgress(newProgress);
    await syncProgressToBackend(newProgress);
    return true;
  };

  const completeLevel = async (level: number, score: number) => {
    const requirement = getScoreRequirement(level);
    if (score >= requirement) {
      const nextLevel = level + 1;
      if (nextLevel <= 50 && !progress.unlockedLevels.includes(nextLevel)) {
        await unlockLevel(nextLevel);
      }
      return true;
    }
    return false;
  };

  const addCoins = async (amount: number) => {
    const newProgress = { ...progress, totalCoins: progress.totalCoins + amount };
    await saveProgress(newProgress);
    await syncProgressToBackend(newProgress);
  };

  const claimDailyReward = async () => {
    if (!progress.hasClaimedDailyReward) {
      const today = new Date().toDateString();
      const lastPlayed = new Date(progress.lastPlayedDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastPlayed.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = progress.dailyStreak;
      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = progress.dailyStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken - reset to 1 (today counts as day 1)
        newStreak = 1;
      } else if (diffDays === 0 && progress.dailyStreak === 0) {
        // First time claiming today, start streak at 1
        newStreak = 1;
      }

      const baseReward = 50;
      const streakBonus = newStreak * 10;
      const totalReward = baseReward + streakBonus;

      const newProgress = {
        ...progress,
        totalCoins: progress.totalCoins + totalReward,
        hasClaimedDailyReward: true,
        dailyStreak: newStreak,
        lastPlayedDate: today
      };
      await saveProgress(newProgress);
      await syncProgressToBackend(newProgress);
      return totalReward;
    }
    return 0;
  };

  const updateGameStats = async (score: number, level: number) => {
    const currentLevelBest = progress.levelScores[level] || 0;
    const newLevelScores = {
      ...progress.levelScores,
      [level]: Math.max(currentLevelBest, score)
    };

    const newProgress = {
      ...progress,
      totalGamesPlayed: progress.totalGamesPlayed + 1,
      highestScore: Math.max(progress.highestScore, score),
      levelScores: newLevelScores
    };
    await saveProgress(newProgress);
    
    // Sync with backend if user has a profile
    await syncProgressToBackend(newProgress);
  };

  const syncProgressToBackend = async (progressData: LevelProgress) => {
    try {
      const profileId = localStorage.getItem('profileId');
      if (!profileId) return; // No profile, skip backend sync

      const { error } = await supabase
        .from('profiles')
        .update({
          highest_score: progressData.highestScore,
          current_level: progressData.currentLevel,
          total_coins: progressData.totalCoins
        })
        .eq('id', profileId);

      if (error) {
        console.error('Failed to sync progress to backend:', error);
      } else {
        console.log('✅ Progress synced to backend');
      }
    } catch (error) {
      console.error('Error syncing to backend:', error);
    }
  };

  const hasCompletedLevel = (level: number, score: number): boolean => {
    const requirement = getScoreRequirement(level);
    return score >= requirement;
  };

  const getLevelBestScore = (level: number): number => {
    return progress.levelScores[level] || 0;
  };

  const resetProgress = async () => {
    await saveProgress(INITIAL_PROGRESS);
  };

  return {
    progress,
    isLoading,
    watchAdForLevel,
    selectLevel,
    unlockLevel,
    completeLevel,
    addCoins,
    claimDailyReward,
    updateGameStats,
    resetProgress,
    canWatchAdToday,
    hasCompletedLevel,
    getLevelBestScore,
    getScoreRequirement
  };
};
