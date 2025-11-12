import { useState, useEffect, useCallback } from 'react';
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

export interface UserPosition {
  rank: number;
  entry: LeaderboardEntry | null;
  totalPlayers: number;
}

export const useLeaderboard = (currentProfileId?: string) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get total count of players
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Load top 100 entries
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

      // Get user's position if they have a profile
      if (currentProfileId) {
        await loadUserPosition(currentProfileId, totalCount || 0);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentProfileId]);

  const loadUserPosition = async (profileId: string, totalPlayers: number) => {
    try {
      // Get user's profile
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (userError || !userProfile) {
        setUserPosition(null);
        return;
      }

      // Count how many players have a higher score
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('highest_score', userProfile.highest_score || 0);

      if (countError) {
        console.error('Error counting user position:', countError);
        return;
      }

      const rank = (count || 0) + 1;

      // Check if user is in the top 100
      const userEntry: LeaderboardEntry = {
        id: userProfile.id,
        rank,
        username: userProfile.username,
        city: userProfile.city,
        country: userProfile.country,
        score: userProfile.highest_score || 0,
        level: userProfile.current_level || 1,
        avatarColor: userProfile.avatar_color,
        isCurrentUser: true
      };

      setUserPosition({
        rank,
        entry: userEntry,
        totalPlayers
      });
    } catch (error) {
      console.error('Error loading user position:', error);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    // Subscribe to realtime updates for profiles table
    const profilesChannel = supabase
      .channel('leaderboard-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // Only reload if highest_score was updated
          if (payload.eventType === 'UPDATE' && payload.new?.highest_score !== payload.old?.highest_score) {
            console.log('Profile score updated:', payload);
            loadLeaderboard();
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            console.log('Profile changed:', payload);
            loadLeaderboard();
          }
        }
      )
      .subscribe();

    // Subscribe to realtime updates for leaderboard table
    const leaderboardChannel = supabase
      .channel('leaderboard-scores-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard'
        },
        (payload) => {
          console.log('New score submitted:', payload);
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(leaderboardChannel);
    };
  }, [loadLeaderboard]);

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

  return { entries, userPosition, isLoading, submitScore, refresh: loadLeaderboard };
};