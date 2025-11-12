import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  coinReward: number;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  maxProgress: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', title: 'First Steps', description: 'Complete your first game', icon: '🎮', coinReward: 50, unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'score_1000', title: 'Rising Star', description: 'Score 1,000 points in a single game', icon: '⭐', coinReward: 100, unlocked: false, progress: 0, maxProgress: 1000 },
  { id: 'score_5000', title: 'Block Master', description: 'Score 5,000 points in a single game', icon: '🏆', coinReward: 250, unlocked: false, progress: 0, maxProgress: 5000 },
  { id: 'level_10', title: 'Climbing High', description: 'Reach level 10', icon: '🧗', coinReward: 150, unlocked: false, progress: 0, maxProgress: 10 },
  { id: 'level_25', title: 'Halfway There', description: 'Reach level 25', icon: '🎯', coinReward: 300, unlocked: false, progress: 0, maxProgress: 25 },
  { id: 'level_50', title: 'Ultimate Champion', description: 'Reach level 50', icon: '👑', coinReward: 500, unlocked: false, progress: 0, maxProgress: 50 },
  { id: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', coinReward: 200, unlocked: false, progress: 0, maxProgress: 7 },
  { id: 'games_50', title: 'Dedicated Player', description: 'Play 50 games', icon: '🎲', coinReward: 300, unlocked: false, progress: 0, maxProgress: 50 },
  { id: 'ads_watched_20', title: 'Supporter', description: 'Watch 20 ads', icon: '📺', coinReward: 150, unlocked: false, progress: 0, maxProgress: 20 },
];

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { value } = await Preferences.get({ key: 'achievements' });
      if (value) {
        setAchievements(JSON.parse(value));
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAchievements = async (newAchievements: Achievement[]) => {
    try {
      await Preferences.set({
        key: 'achievements',
        value: JSON.stringify(newAchievements)
      });
      setAchievements(newAchievements);
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  };

  const checkAndUnlock = async (achievementId: string, currentProgress: number): Promise<{ unlocked: boolean; achievement?: Achievement }> => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return { unlocked: false };

    const updatedAchievements = achievements.map(a => {
      if (a.id === achievementId) {
        const newProgress = Math.min(currentProgress, a.maxProgress);
        if (newProgress >= a.maxProgress && !a.unlocked) {
          return { ...a, progress: newProgress, unlocked: true, unlockedDate: new Date().toISOString() };
        }
        return { ...a, progress: newProgress };
      }
      return a;
    });

    await saveAchievements(updatedAchievements);

    const unlockedAchievement = updatedAchievements.find(a => a.id === achievementId && a.unlocked && !achievement.unlocked);
    return { unlocked: !!unlockedAchievement, achievement: unlockedAchievement };
  };

  const getUnlockedCount = () => achievements.filter(a => a.unlocked).length;
  const getTotalCoinsEarned = () => achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.coinReward, 0);

  return {
    achievements,
    isLoading,
    checkAndUnlock,
    getUnlockedCount,
    getTotalCoinsEarned
  };
};
