import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

export interface LevelProgress {
  currentLevel: number;
  unlockedLevels: number[];
  adsWatchedForNextLevel: number;
  adsRequiredPerLevel: number;
  adsWatchedForUnlockToday: number; // 0-2 daily limit for level unlocks
  lastAdUnlockDate: string; // For daily reset of ad unlock counter
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
  levelCompletionMethod: { [level: number]: 'score' | 'ad' }; // How each level was completed
  levelStars: { [level: number]: number }; // 1-3 stars per level
  levelAttempts: { [level: number]: number }; // Number of attempts per level
  totalAdsWatched: number;
}

const INITIAL_PROGRESS: LevelProgress = {
  currentLevel: 1,
  unlockedLevels: [1], // Only Level 1 unlocked initially
  adsWatchedForNextLevel: 0,
  adsRequiredPerLevel: 3,
  adsWatchedForUnlockToday: 0, // Daily limit: 2 levels per day via ads
  lastAdUnlockDate: new Date().toDateString(),
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
  levelCompletionMethod: {},
  levelStars: {},
  levelAttempts: {},
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

// Calculate the highest level reached based on score
export const getLevelReached = (score: number): number => {
  // Check each level requirement from highest to lowest
  for (let level = 50; level >= 1; level--) {
    const requirement = getScoreRequirement(level);
    if (score >= requirement) {
      return level + 1; // Return the next level (the level they've reached)
    }
  }
  // If score is below level 1 requirement, they're still on level 1
  return 1;
};

export const useGameProgress = () => {
  const [progress, setProgress] = useState<LevelProgress>(INITIAL_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const migrateProgress = (savedProgress: any): LevelProgress => {
    // Migrate old progress format to new format
    return {
      ...INITIAL_PROGRESS,
      ...savedProgress,
      // Ensure new fields exist
      adsWatchedForUnlockToday: savedProgress.adsWatchedForUnlockToday ?? 0,
      lastAdUnlockDate: savedProgress.lastAdUnlockDate ?? new Date().toDateString(),
      levelCompletionMethod: savedProgress.levelCompletionMethod ?? {},
      levelStars: savedProgress.levelStars ?? {},
      levelAttempts: savedProgress.levelAttempts ?? {},
      // Migrate unlockedLevels: if old format had multiple levels, keep only Level 1 if it's a fresh start
      // Otherwise, keep existing unlocked levels (for existing users)
      unlockedLevels: savedProgress.unlockedLevels && savedProgress.unlockedLevels.length > 0 
        ? savedProgress.unlockedLevels 
        : [1]
    };
  };

  const loadProgress = async () => {
    try {
      const { value } = await Preferences.get({ key: 'gameProgress' });
      if (value) {
        const savedProgress = JSON.parse(value);
        updateDailyStreak(savedProgress);
        const migratedProgress = migrateProgress(savedProgress);
        setProgress(migratedProgress);
        // Save migrated progress back
        await saveProgress(migratedProgress);
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
    
    // Reset daily counters if new day
    if (progress.lastAdWatchDate !== today) {
      progress.adsWatchedToday = 0;
      progress.lastAdWatchDate = today;
    }
    if (progress.lastAdUnlockDate !== today) {
      progress.adsWatchedForUnlockToday = 0;
      progress.lastAdUnlockDate = today;
    }

    // Check daily ad limit for watching ads
    if (progress.adsWatchedToday >= progress.maxAdsPerDay) {
      return { success: false, message: 'Daily ad limit reached. Come back tomorrow!' };
    }

    // Check daily limit for level unlocks (max 2 levels per day via ads)
    if (progress.adsWatchedForUnlockToday >= 2) {
      return { success: false, message: 'Daily level unlock limit reached! You can only unlock 2 levels per day via ads. Come back tomorrow!' };
    }

    const newAdsWatched = progress.adsWatchedForNextLevel + 1;
    const nextLevel = Math.max(...progress.unlockedLevels) + 1;

    if (newAdsWatched >= progress.adsRequiredPerLevel) {
      // Unlock next level after watching 3 ads
      const newProgress = {
        ...progress,
        unlockedLevels: [...progress.unlockedLevels, nextLevel],
        adsWatchedForNextLevel: 0,
        adsWatchedForUnlockToday: progress.adsWatchedForUnlockToday + 1,
        lastAdUnlockDate: today,
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

  const addCoins = async (amount: number) => {
    const newProgress = { ...progress, totalCoins: progress.totalCoins + amount };
    await saveProgress(newProgress);
    await syncProgressToBackend(newProgress);
  };

  const claimDailyReward = async () => {
    if (!progress.hasClaimedDailyReward) {
      const baseReward = 50;
      const streakBonus = progress.dailyStreak * 10;
      const totalReward = baseReward + streakBonus;

      const newProgress = {
        ...progress,
        totalCoins: progress.totalCoins + totalReward,
        hasClaimedDailyReward: true
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

    const requirement = getScoreRequirement(level);
    const isLevelCompleted = score >= requirement;
    
    let newLevelCompletionMethod = { ...progress.levelCompletionMethod };
    let newLevelStars = { ...progress.levelStars };
    let newUnlockedLevels = [...progress.unlockedLevels];

    // If level is completed by score (not by ad)
    if (isLevelCompleted && newLevelCompletionMethod[level] !== 'ad') {
      // Set completion method to score
      newLevelCompletionMethod[level] = 'score';
      
      // Calculate stars based on attempts
      const attempts = progress.levelAttempts[level] || 1;
      if (attempts === 1) {
        newLevelStars[level] = 3; // 3 stars for first attempt
      } else if (attempts === 2) {
        newLevelStars[level] = 2; // 2 stars for second attempt
      } else {
        newLevelStars[level] = 1; // 1 star for 3+ attempts
      }

      // Unlock next level when current level is completed
      const nextLevel = level + 1;
      if (nextLevel <= 50 && !newUnlockedLevels.includes(nextLevel)) {
        newUnlockedLevels.push(nextLevel);
      }
    }

    // Update currentLevel to next level if current level is completed
    let newCurrentLevel = progress.currentLevel;
    if (isLevelCompleted) {
      const nextLevel = level + 1;
      if (nextLevel <= 50) {
        newCurrentLevel = Math.max(newCurrentLevel, nextLevel);
      }
    }

    const newProgress = {
      ...progress,
      currentLevel: newCurrentLevel,
      totalGamesPlayed: progress.totalGamesPlayed + 1,
      highestScore: Math.max(progress.highestScore, score),
      levelScores: newLevelScores,
      levelCompletionMethod: newLevelCompletionMethod,
      levelStars: newLevelStars,
      unlockedLevels: newUnlockedLevels
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

  const getStarsForLevel = (level: number): number => {
    return progress.levelStars[level] || 0;
  };

  const incrementLevelAttempt = async (level: number) => {
    const newLevelAttempts = {
      ...progress.levelAttempts,
      [level]: (progress.levelAttempts[level] || 0) + 1
    };
    const newProgress = {
      ...progress,
      levelAttempts: newLevelAttempts
    };
    await saveProgress(newProgress);
  };

  const watchAdToCompleteLevel = async (level: number, currentScore: number) => {
    const today = new Date().toDateString();
    
    // Reset daily counters if new day
    if (progress.lastAdWatchDate !== today) {
      progress.adsWatchedToday = 0;
      progress.lastAdWatchDate = today;
    }
    if (progress.lastAdUnlockDate !== today) {
      progress.adsWatchedForUnlockToday = 0;
      progress.lastAdUnlockDate = today;
    }

    // Check daily ad limit for watching ads
    if (progress.adsWatchedToday >= progress.maxAdsPerDay) {
      return { success: false, message: 'Daily ad limit reached. Come back tomorrow!' };
    }

    // Check daily limit for level unlocks (max 2 levels per day via ads)
    if (progress.adsWatchedForUnlockToday >= 2) {
      return { success: false, message: 'Daily level unlock limit reached! You can only unlock 2 levels per day via ads. Come back tomorrow!' };
    }

    const requirement = getScoreRequirement(level);
    const newLevelScores = {
      ...progress.levelScores,
      [level]: Math.max(progress.levelScores[level] || 0, requirement) // Mark as completed with requirement score
    };

    // Set completion method to ad and give 3 stars
    const newLevelCompletionMethod = {
      ...progress.levelCompletionMethod,
      [level]: 'ad' as const
    };
    const newLevelStars = {
      ...progress.levelStars,
      [level]: 3 // Always 3 stars for ad completion
    };

    // Unlock next level if not already unlocked
    const nextLevel = level + 1;
    const newUnlockedLevels = progress.unlockedLevels.includes(nextLevel)
      ? progress.unlockedLevels
      : [...progress.unlockedLevels, nextLevel];

    const newProgress = {
      ...progress,
      levelScores: newLevelScores,
      levelCompletionMethod: newLevelCompletionMethod,
      levelStars: newLevelStars,
      unlockedLevels: newUnlockedLevels,
      currentLevel: Math.max(progress.currentLevel, nextLevel), // Progress to next level
      totalCoins: progress.totalCoins + 100, // Reward for completing level via ad
      adsWatchedToday: progress.adsWatchedToday + 1,
      adsWatchedForUnlockToday: progress.adsWatchedForUnlockToday + 1,
      lastAdWatchDate: today,
      lastAdUnlockDate: today,
      totalAdsWatched: progress.totalAdsWatched + 1
    };

    await saveProgress(newProgress);
    await syncProgressToBackend(newProgress);
    
    return { 
      success: true, 
      coinsEarned: 100,
      levelCompleted: level,
      nextLevelUnlocked: nextLevel
    };
  };

  const watchAdForCoins = async (coinAmount: number = 50) => {
    const today = new Date().toDateString();
    
    // Reset daily counter if new day
    if (progress.lastAdWatchDate !== today) {
      progress.adsWatchedToday = 0;
      progress.lastAdWatchDate = today;
    }

    if (progress.adsWatchedToday >= progress.maxAdsPerDay) {
      return { success: false, message: 'Daily ad limit reached. Come back tomorrow!' };
    }

    const newProgress = {
      ...progress,
      totalCoins: progress.totalCoins + coinAmount,
      adsWatchedToday: progress.adsWatchedToday + 1,
      lastAdWatchDate: today,
      totalAdsWatched: progress.totalAdsWatched + 1
    };

    await saveProgress(newProgress);
    await syncProgressToBackend(newProgress);
    
    return { 
      success: true, 
      coinsEarned: coinAmount
    };
  };

  const resetProgress = async () => {
    await saveProgress(INITIAL_PROGRESS);
  };

  return {
    progress,
    isLoading,
    watchAdForLevel,
    watchAdToCompleteLevel,
    watchAdForCoins,
    selectLevel,
    addCoins,
    claimDailyReward,
    updateGameStats,
    resetProgress,
    canWatchAdToday,
    hasCompletedLevel,
    getLevelBestScore,
    getScoreRequirement,
    getStarsForLevel,
    incrementLevelAttempt
  };
};
