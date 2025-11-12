import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  city: string;
  country: string;
  score: number;
  level: number;
  avatarColor: string;
  isCurrentUser?: boolean;
}

export const useLeaderboard = (currentProfileId?: string) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfileId]);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('highest_score', { ascending: false })
        .limit(100);

      if (error) throw error;

      const leaderboardEntries: LeaderboardEntry[] = (data || []).map((entry, index) => ({
        id: entry.id,
        rank: index + 1,
        username: entry.username,
        city: entry.city,
        country: entry.country,
        score: entry.highest_score || 0,
        level: entry.current_level || 1,
        avatarColor: entry.avatar_color,
        isCurrentUser: currentProfileId === entry.id
      }));

      setEntries(leaderboardEntries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitScore = async (profileId: string, score: number, level: number) => {
    try {
      await supabase
        .from('leaderboard')
        .insert({
          profile_id: profileId,
          score,
          level
        });

      // Reload leaderboard after submission
      await loadLeaderboard();
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  return { entries, isLoading, submitScore, refresh: loadLeaderboard };
};