import { useState, useEffect, useRef, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

export interface LevelProgress {
  currentLevel: number;
  selectedLevel: number;
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
  adsWatchedForUnlockCountToday: number; // Count of ads watched specifically to unlock levels
  maxAdsForUnlockPerDay: number; // Daily limit for ads watched to unlock levels
  levelScores: { [level: number]: number };
  levelCompletionMethod: { [level: number]: 'score' | 'ad' }; // How each level was completed
  levelStars: { [level: number]: number }; // 1-3 stars per level
  levelAttempts: { [level: number]: number }; // Number of attempts per level
  totalAdsWatched: number;
}

type ClaimDailyRewardOptions = {
  adVerified: boolean;
};

type ClaimDailyRewardResult = {
  success: boolean;
  reward: number;
  message?: string;
};

const INITIAL_PROGRESS: LevelProgress = {
  currentLevel: 1,
  selectedLevel: 1,
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
  adsWatchedForUnlockCountToday: 0, // Count of ads watched specifically to unlock levels
  maxAdsForUnlockPerDay: 6, // Daily limit for ads watched to unlock levels
  levelScores: {},
  levelCompletionMethod: {},
  levelStars: {},
  levelAttempts: {},
  totalAdsWatched: 0
};

const LEVEL_POINT_STEP = 300;

export const getScoreRequirement = (level: number): number => {
  return Math.max(level, 1) * LEVEL_POINT_STEP;
};

const clampStars = (stars: number) => Math.max(0, Math.min(3, Math.floor(stars)));

const calculateLevelPoints = (
  level: number,
  stars: number,
  completionMethod?: LevelProgress['levelCompletionMethod'][number]
) => {
  if (completionMethod !== 'score') return 0;
  const requirement = getScoreRequirement(level);
  const starRatio = clampStars(stars) / 3;
  return Math.round(requirement * starRatio);
};

const calculateTotalProgressPoints = (
  levelStars: LevelProgress['levelStars'],
  completionMethod: LevelProgress['levelCompletionMethod']
) => {
  return Object.entries(levelStars).reduce((total, [levelStr, stars]) => {
    const level = Number(levelStr);
    if (Number.isNaN(level)) return total;
    return total + calculateLevelPoints(level, stars, completionMethod[level]);
  }, 0);
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
  // Use ref to always have latest progress state
  const progressRef = useRef<LevelProgress>(INITIAL_PROGRESS);
  
  // Keep ref in sync with state
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const migrateProgress = (savedProgress: Partial<LevelProgress>): LevelProgress => {
    // Migrate old progress format to new format
    // IMPORTANT: Spread INITIAL_PROGRESS first, then savedProgress to keep existing data
    const migrated: LevelProgress = {
      ...INITIAL_PROGRESS,
      ...savedProgress,
      // Override with saved values (preserve existing data)
      currentLevel: savedProgress.currentLevel ?? INITIAL_PROGRESS.currentLevel,
      selectedLevel: savedProgress.selectedLevel
        ?? savedProgress.currentLevel
        ?? INITIAL_PROGRESS.selectedLevel,
      unlockedLevels: savedProgress.unlockedLevels && savedProgress.unlockedLevels.length > 0 
        ? savedProgress.unlockedLevels 
        : INITIAL_PROGRESS.unlockedLevels,
      adsWatchedForNextLevel: savedProgress.adsWatchedForNextLevel ?? INITIAL_PROGRESS.adsWatchedForNextLevel,
      adsRequiredPerLevel: savedProgress.adsRequiredPerLevel ?? INITIAL_PROGRESS.adsRequiredPerLevel,
      adsWatchedForUnlockToday: savedProgress.adsWatchedForUnlockToday ?? INITIAL_PROGRESS.adsWatchedForUnlockToday,
      lastAdUnlockDate: savedProgress.lastAdUnlockDate ?? INITIAL_PROGRESS.lastAdUnlockDate,
      totalCoins: savedProgress.totalCoins ?? INITIAL_PROGRESS.totalCoins,
      dailyStreak: savedProgress.dailyStreak ?? INITIAL_PROGRESS.dailyStreak,
      lastPlayedDate: savedProgress.lastPlayedDate ?? INITIAL_PROGRESS.lastPlayedDate,
      hasClaimedDailyReward: savedProgress.hasClaimedDailyReward ?? INITIAL_PROGRESS.hasClaimedDailyReward,
      totalGamesPlayed: savedProgress.totalGamesPlayed ?? INITIAL_PROGRESS.totalGamesPlayed,
      highestScore: savedProgress.highestScore ?? INITIAL_PROGRESS.highestScore,
      lastAdWatchDate: savedProgress.lastAdWatchDate ?? INITIAL_PROGRESS.lastAdWatchDate,
      adsWatchedToday: savedProgress.adsWatchedToday ?? INITIAL_PROGRESS.adsWatchedToday,
      maxAdsPerDay: savedProgress.maxAdsPerDay ?? INITIAL_PROGRESS.maxAdsPerDay,
      // NEW FIELDS - use saved value if exists, otherwise default
      adsWatchedForUnlockCountToday: savedProgress.adsWatchedForUnlockCountToday !== undefined 
        ? savedProgress.adsWatchedForUnlockCountToday 
        : INITIAL_PROGRESS.adsWatchedForUnlockCountToday,
      maxAdsForUnlockPerDay: savedProgress.maxAdsForUnlockPerDay ?? INITIAL_PROGRESS.maxAdsForUnlockPerDay,
      levelScores: savedProgress.levelScores ?? INITIAL_PROGRESS.levelScores,
      levelCompletionMethod: savedProgress.levelCompletionMethod ?? INITIAL_PROGRESS.levelCompletionMethod,
      levelStars: savedProgress.levelStars ?? INITIAL_PROGRESS.levelStars,
      levelAttempts: savedProgress.levelAttempts ?? INITIAL_PROGRESS.levelAttempts,
      totalAdsWatched: savedProgress.totalAdsWatched ?? INITIAL_PROGRESS.totalAdsWatched
    };

    const normalizedLevelStars = { ...migrated.levelStars };
    const normalizedCompletionMethod = { ...migrated.levelCompletionMethod };

    // Ensure any level with stars recorded is marked as completed by score
    Object.entries(normalizedLevelStars).forEach(([levelStr, stars]) => {
      const level = Number(levelStr);
      if (Number.isNaN(level)) return;
      if (stars > 0 && normalizedCompletionMethod[level] !== 'score') {
        normalizedCompletionMethod[level] = 'score';
      }
      if (stars > 3) {
        normalizedLevelStars[level] = 3;
      }
    });

    // Backfill stars/method for levels with a qualifying best score but missing metadata
    Object.entries(migrated.levelScores).forEach(([levelStr, bestScore]) => {
      const level = Number(levelStr);
      if (Number.isNaN(level)) return;
      const requirement = getScoreRequirement(level);
      if (bestScore >= requirement) {
        normalizedCompletionMethod[level] = 'score';
        if (!normalizedLevelStars[level] || normalizedLevelStars[level] < 1) {
          normalizedLevelStars[level] = 1;
        }
      }
    });

    const recalculatedScore = calculateTotalProgressPoints(
      normalizedLevelStars,
      normalizedCompletionMethod
    );

    const highestUnlockedLevel = migrated.unlockedLevels.length > 0
      ? Math.max(...migrated.unlockedLevels)
      : INITIAL_PROGRESS.currentLevel;
    const normalizedCurrentLevel = Math.max(migrated.currentLevel, highestUnlockedLevel);
    let normalizedSelectedLevel = migrated.selectedLevel ?? normalizedCurrentLevel;
    if (!migrated.unlockedLevels.includes(normalizedSelectedLevel)) {
      normalizedSelectedLevel = highestUnlockedLevel;
    }

    return {
      ...migrated,
      currentLevel: normalizedCurrentLevel,
      selectedLevel: normalizedSelectedLevel,
      levelStars: normalizedLevelStars,
      levelCompletionMethod: normalizedCompletionMethod,
      highestScore: recalculatedScore
    };
  };

  const saveProgress = useCallback(async (newProgress: LevelProgress) => {
    // Update ref first
    progressRef.current = newProgress;
    // Update local state immediately so UI reflects changes in real time
    setProgress(newProgress);

    try {
      await Preferences.set({
        key: 'gameProgress',
        value: JSON.stringify(newProgress)
      });
      console.log('✅ Progress saved:', {
        adsWatchedForNextLevel: newProgress.adsWatchedForNextLevel,
        adsWatchedForUnlockCountToday: newProgress.adsWatchedForUnlockCountToday,
        maxAdsForUnlockPerDay: newProgress.maxAdsForUnlockPerDay
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: 'gameProgress' });
      if (value) {
        const savedProgress = JSON.parse(value) as Partial<LevelProgress>;
        console.log('📂 Loaded saved progress:', {
          hasAdsWatchedForUnlockCountToday: 'adsWatchedForUnlockCountToday' in savedProgress,
          hasMaxAdsForUnlockPerDay: 'maxAdsForUnlockPerDay' in savedProgress,
          adsWatchedForUnlockCountToday: savedProgress.adsWatchedForUnlockCountToday,
          maxAdsForUnlockPerDay: savedProgress.maxAdsForUnlockPerDay
        });
        updateDailyStreak(savedProgress);
        const migratedProgress = migrateProgress(savedProgress);
        console.log('🔄 Migrated progress:', {
          adsWatchedForUnlockCountToday: migratedProgress.adsWatchedForUnlockCountToday,
          maxAdsForUnlockPerDay: migratedProgress.maxAdsForUnlockPerDay,
          adsWatchedForNextLevel: migratedProgress.adsWatchedForNextLevel
        });
        progressRef.current = migratedProgress; // Update ref first
        setProgress(migratedProgress);
        // Save migrated progress back
        await saveProgress(migratedProgress);
      } else {
        console.log('📂 No saved progress, using initial state');
        progressRef.current = INITIAL_PROGRESS; // Update ref for initial state
        setProgress(INITIAL_PROGRESS);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [saveProgress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const updateDailyStreak = (savedProgress: LevelProgress) => {
    const today = new Date().toDateString();
    const lastPlayedRef = savedProgress.lastPlayedDate || today;
    const lastPlayed = new Date(lastPlayedRef);
    const todayDate = new Date(today);
    const lastPlayedTime = lastPlayed.getTime();

    if (Number.isNaN(lastPlayedTime)) {
      savedProgress.lastPlayedDate = today;
      savedProgress.dailyStreak = 0;
      savedProgress.hasClaimedDailyReward = false;
      return;
    }

    const diffTime = todayDate.getTime() - lastPlayedTime;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 1) {
      savedProgress.hasClaimedDailyReward = false;
      if (diffDays > 1) {
        savedProgress.dailyStreak = 0;
      }
    }
  };

  const canWatchAdToday = (adsNeeded: number = 1) => {
    const today = new Date().toDateString();
    if (progress.lastAdWatchDate !== today) {
      return adsNeeded <= progress.maxAdsPerDay;
    }
    return (progress.adsWatchedToday + adsNeeded) <= progress.maxAdsPerDay;
  };

  const watchAdForLevel = async () => {
    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    const today = new Date().toDateString();
    
    console.log('📺 watchAdForLevel called, current state:', {
      adsWatchedForNextLevel: currentProgress.adsWatchedForNextLevel,
      adsWatchedForUnlockCountToday: currentProgress.adsWatchedForUnlockCountToday,
      lastAdUnlockDate: currentProgress.lastAdUnlockDate,
      today,
      maxAdsForUnlockPerDay: currentProgress.maxAdsForUnlockPerDay
    });
    
    // Reset daily counters if new day - create new object, don't mutate
    let updatedProgress = { ...currentProgress };
    
    // Only reset if it's actually a new day (not just a different time)
    if (currentProgress.lastAdWatchDate && currentProgress.lastAdWatchDate !== today) {
      updatedProgress = {
        ...updatedProgress,
        adsWatchedToday: 0,
        lastAdWatchDate: today
      };
    } else if (!currentProgress.lastAdWatchDate) {
      updatedProgress = {
        ...updatedProgress,
        lastAdWatchDate: today
      };
    }
    
    // Only reset unlock counters if it's actually a new day
    if (currentProgress.lastAdUnlockDate && currentProgress.lastAdUnlockDate !== today) {
      console.log('🔄 Resetting daily unlock counters (new day)', {
        oldDate: currentProgress.lastAdUnlockDate,
        newDate: today
      });
      updatedProgress = {
        ...updatedProgress,
        adsWatchedForUnlockToday: 0,
        adsWatchedForUnlockCountToday: 0,
        lastAdUnlockDate: today
      };
    } else if (!currentProgress.lastAdUnlockDate) {
      updatedProgress = {
        ...updatedProgress,
        lastAdUnlockDate: today
      };
    }

    // Check daily ad limit for unlocking (6 ads per day)
    if (updatedProgress.adsWatchedForUnlockCountToday >= updatedProgress.maxAdsForUnlockPerDay) {
      return { success: false, message: 'Daily ad limit for unlocking reached. Come back tomorrow!' };
    }

    // Check daily limit for level unlocks (max 2 levels per day via ads)
    if (updatedProgress.adsWatchedForUnlockToday >= 2) {
      return { success: false, message: 'Daily level unlock limit reached! You can only unlock 2 levels per day via ads. Come back tomorrow!' };
    }

    const nextLevel = Math.max(...updatedProgress.unlockedLevels) + 1;
    if (nextLevel <= 2) {
      return {
        success: false,
        message: 'Complete Level 1 to unlock Level 2. Ads are only for Level 3 and above.'
      };
    }
    if (nextLevel > 50) {
      return { success: false, message: 'All levels are already unlocked!' };
    }

    const adsWatchedForNextLevel = updatedProgress.adsWatchedForNextLevel + 1;
    const newUnlockCount = updatedProgress.adsWatchedForUnlockCountToday + 1;

    console.log('📊 Updating counters:', {
      adsWatchedForNextLevel,
      newUnlockCount,
      previousUnlockCount: updatedProgress.adsWatchedForUnlockCountToday
    });

    const baseProgress = {
      ...updatedProgress,
      adsWatchedForNextLevel,
      adsWatchedToday: updatedProgress.adsWatchedToday + 1,
      adsWatchedForUnlockCountToday: newUnlockCount,
      lastAdWatchDate: today,
      totalAdsWatched: updatedProgress.totalAdsWatched + 1,
      totalCoins: updatedProgress.totalCoins + 10
    };

    if (adsWatchedForNextLevel >= updatedProgress.adsRequiredPerLevel) {
      const updatedUnlockedLevels = Array.from(new Set([...updatedProgress.unlockedLevels, nextLevel])).sort((a, b) => a - b);
      const highestUnlocked = Math.max(...updatedUnlockedLevels);
      const nextSelection = Math.min(nextLevel, highestUnlocked);
      const newProgress = {
        ...baseProgress,
        unlockedLevels: updatedUnlockedLevels,
        adsWatchedForNextLevel: 0, // Reset for next level unlock
        adsWatchedForUnlockToday: updatedProgress.adsWatchedForUnlockToday + 1,
        lastAdUnlockDate: today,
        totalCoins: baseProgress.totalCoins + 50, // Bonus on unlock
        currentLevel: Math.max(baseProgress.currentLevel, nextLevel),
        selectedLevel: Math.max(
          baseProgress.selectedLevel ?? baseProgress.currentLevel,
          nextSelection
        )
        // Keep adsWatchedForUnlockCountToday - don't reset it! It should continue counting up to 6
      };

      console.log('🎉 Level unlocked! New progress:', {
        level: nextLevel,
        adsWatchedForUnlockCountToday: newProgress.adsWatchedForUnlockCountToday,
        adsWatchedForUnlockToday: newProgress.adsWatchedForUnlockToday,
        adsWatchedForNextLevel: newProgress.adsWatchedForNextLevel
      });

      await saveProgress(newProgress);
      await syncProgressToBackend(newProgress);
      return { success: true, levelUnlocked: true, level: nextLevel };
    }

    await saveProgress(baseProgress);
    return { 
      success: true, 
      levelUnlocked: false,
      adsWatched: adsWatchedForNextLevel,
      adsRemaining: updatedProgress.adsRequiredPerLevel - adsWatchedForNextLevel
    };
  };

  const selectLevel = async (level: number) => {
    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    if (currentProgress.unlockedLevels.includes(level)) {
      const newProgress = { ...currentProgress, selectedLevel: level };
      await saveProgress(newProgress);
    }
  };

  const unlockLevel = async (level: number) => {
    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    if (level < 1 || level > 50) return;
    if (currentProgress.unlockedLevels.includes(level)) return; // Already unlocked
    
    const newProgress = {
      ...currentProgress,
      unlockedLevels: [...currentProgress.unlockedLevels, level].sort((a, b) => a - b),
      adsWatchedForNextLevel: 0
    };
    await saveProgress(newProgress);
    await syncProgressToBackend(newProgress);
    return true;
  };

  const completeLevel = async (level: number, score: number) => {
    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    const requirement = getScoreRequirement(level);
    if (score >= requirement) {
      const nextLevel = level + 1;
      if (nextLevel <= 50 && !currentProgress.unlockedLevels.includes(nextLevel)) {
        await unlockLevel(nextLevel);
      }
      return true;
    }
    return false;
  };

  const addCoins = async (amount: number) => {
    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    const newProgress = { ...currentProgress, totalCoins: currentProgress.totalCoins + amount };
    await saveProgress(newProgress);
    await syncProgressToBackend(newProgress);
  };

  const claimDailyReward = async (options?: ClaimDailyRewardOptions): Promise<ClaimDailyRewardResult> => {
    if (!options?.adVerified) {
      return { success: false, reward: 0, message: 'Reward ad was not completed' };
    }

    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    if (!currentProgress.hasClaimedDailyReward) {
      const today = new Date().toDateString();
      const lastPlayed = new Date(currentProgress.lastPlayedDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastPlayed.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = currentProgress.dailyStreak;
      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = currentProgress.dailyStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken - reset to 1 (today counts as day 1)
        newStreak = 1;
      } else if (diffDays === 0 && currentProgress.dailyStreak === 0) {
        // First time claiming today, start streak at 1
        newStreak = 1;
      }

      const baseReward = 50;
      const streakBonus = newStreak * 10;
      const totalReward = baseReward + streakBonus;

      const newProgress = {
        ...currentProgress,
        totalCoins: currentProgress.totalCoins + totalReward,
        hasClaimedDailyReward: true,
        dailyStreak: newStreak,
        lastPlayedDate: today
      };
      await saveProgress(newProgress);
      await syncProgressToBackend(newProgress);
      return { success: true, reward: totalReward };
    }
    return { success: false, reward: 0, message: 'Daily reward already claimed' };
  };

  const updateGameStats = async (score: number, level: number, sessionAttempts: number = 1) => {
    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    const currentLevelBest = currentProgress.levelScores[level] || 0;
    const newLevelScores = {
      ...currentProgress.levelScores,
      [level]: Math.max(currentLevelBest, score)
    };

    const requirement = getScoreRequirement(level);
    const isLevelCompleted = score >= requirement;
    
    const newLevelCompletionMethod = { ...currentProgress.levelCompletionMethod };
    const newLevelStars = { ...currentProgress.levelStars };
    const newUnlockedLevels = [...currentProgress.unlockedLevels];
    const currentSelectedLevel = currentProgress.selectedLevel ?? currentProgress.currentLevel;
    let newSelectedLevel = currentSelectedLevel;

    // If level is completed by score (regardless of previous ad unlocks)
    if (isLevelCompleted) {
      newLevelCompletionMethod[level] = 'score';

      // Calculate stars based on session attempts (consecutive attempts in current session)
      // 1st attempt = 3 stars, 2nd attempt = 2 stars, 3+ attempts = 1 star
      const starsThisRun = sessionAttempts === 1 ? 3 : sessionAttempts === 2 ? 2 : 1;
      const previousStars = newLevelStars[level] || 0;
      // Only update stars if new value is higher (never downgrade)
      newLevelStars[level] = Math.max(previousStars, starsThisRun);

      // Unlock next level when current level is completed
      const nextLevel = level + 1;
      if (nextLevel <= 50 && !newUnlockedLevels.includes(nextLevel)) {
        newUnlockedLevels.push(nextLevel);
      }

      if (currentSelectedLevel === level) {
        const highestUnlocked = Math.max(...newUnlockedLevels);
        newSelectedLevel = Math.min(nextLevel, highestUnlocked);
      }
    }

    // Update currentLevel to next level if current level is completed
    let newCurrentLevel = currentProgress.currentLevel;
    if (isLevelCompleted) {
      const nextLevel = level + 1;
      if (nextLevel <= 50) {
        newCurrentLevel = Math.max(newCurrentLevel, nextLevel);
      }
    }

    if (!newUnlockedLevels.includes(newSelectedLevel)) {
      newSelectedLevel = Math.max(...newUnlockedLevels);
    }

    const totalLevelPoints = calculateTotalProgressPoints(newLevelStars, newLevelCompletionMethod);

    const newProgress = {
      ...currentProgress,
      currentLevel: newCurrentLevel,
      selectedLevel: newSelectedLevel,
      totalGamesPlayed: currentProgress.totalGamesPlayed + 1,
      highestScore: totalLevelPoints,
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

  // Note: levelAttempts is kept in the interface for backward compatibility
  // but is no longer used for star calculation. Stars are now based on
  // session-based consecutive attempts tracked in the Game component.

  const watchAdToCompleteLevel = async (level: number, currentScore: number) => {
    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    const today = new Date().toDateString();
    
    // Reset daily counters if new day - create new object, don't mutate
    let updatedProgress = { ...currentProgress };
    if (currentProgress.lastAdWatchDate !== today) {
      updatedProgress = {
        ...updatedProgress,
        adsWatchedToday: 0,
        lastAdWatchDate: today
      };
    }
    if (currentProgress.lastAdUnlockDate !== today) {
      updatedProgress = {
        ...updatedProgress,
        adsWatchedForUnlockToday: 0,
        lastAdUnlockDate: today
      };
    }

    // Check daily ad limit for watching ads
    if (updatedProgress.adsWatchedToday >= updatedProgress.maxAdsPerDay) {
      return { success: false, message: 'Daily ad limit reached. Come back tomorrow!' };
    }

    // Check daily limit for level unlocks (max 2 levels per day via ads)
    if (updatedProgress.adsWatchedForUnlockToday >= 2) {
      return { success: false, message: 'Daily level unlock limit reached! You can only unlock 2 levels per day via ads. Come back tomorrow!' };
    }

    const requirement = getScoreRequirement(level);
    const newLevelScores = {
      ...updatedProgress.levelScores,
      [level]: Math.max(updatedProgress.levelScores[level] || 0, currentScore) // Keep actual score; no bonus points
    };

    // Set completion method to ad and give 0 stars until player clears it normally
    const newLevelCompletionMethod = {
      ...updatedProgress.levelCompletionMethod,
      [level]: 'ad' as const
    };
    const newLevelStars = {
      ...updatedProgress.levelStars,
      [level]: 0
    };

    // Unlock next level if not already unlocked
    const nextLevel = level + 1;
    const newUnlockedLevels = updatedProgress.unlockedLevels.includes(nextLevel)
      ? updatedProgress.unlockedLevels
      : [...updatedProgress.unlockedLevels, nextLevel];

    const highestUnlocked = Math.max(...newUnlockedLevels);
    const nextSelection = Math.min(nextLevel, highestUnlocked);

    const newProgress = {
      ...updatedProgress,
      levelScores: newLevelScores,
      levelCompletionMethod: newLevelCompletionMethod,
      levelStars: newLevelStars,
      unlockedLevels: newUnlockedLevels,
      currentLevel: Math.max(updatedProgress.currentLevel, nextLevel), // Progress to next level
      selectedLevel: Math.max(
        updatedProgress.selectedLevel ?? updatedProgress.currentLevel,
        nextSelection
      ),
      totalCoins: updatedProgress.totalCoins + 100, // Reward for completing level via ad
      adsWatchedToday: updatedProgress.adsWatchedToday + 1,
      adsWatchedForUnlockToday: updatedProgress.adsWatchedForUnlockToday + 1,
      lastAdWatchDate: today,
      lastAdUnlockDate: today,
      totalAdsWatched: updatedProgress.totalAdsWatched + 1,
      adsWatchedForNextLevel: 0,
      highestScore: calculateTotalProgressPoints(newLevelStars, newLevelCompletionMethod)
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
    // Use ref to get latest state (avoids stale closure issues)
    const currentProgress = progressRef.current;
    const today = new Date().toDateString();
    
    // Reset daily counter if new day - create new object, don't mutate
    let updatedProgress = { ...currentProgress };
    if (currentProgress.lastAdWatchDate !== today) {
      updatedProgress = {
        ...updatedProgress,
        adsWatchedToday: 0,
        lastAdWatchDate: today
      };
    }

    if (updatedProgress.adsWatchedToday >= updatedProgress.maxAdsPerDay) {
      return { success: false, message: 'Daily ad limit reached. Come back tomorrow!' };
    }

    const newProgress = {
      ...updatedProgress,
      totalCoins: updatedProgress.totalCoins + coinAmount,
      adsWatchedToday: updatedProgress.adsWatchedToday + 1,
      lastAdWatchDate: today,
      totalAdsWatched: updatedProgress.totalAdsWatched + 1
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
    unlockLevel,
    completeLevel,
    addCoins,
    claimDailyReward,
    updateGameStats,
    resetProgress,
    canWatchAdToday,
    hasCompletedLevel,
    getLevelBestScore,
    getScoreRequirement,
    getStarsForLevel
  };
};
