import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

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
      if (!isSupabaseConfigured) {
        setEntries([]);
        setUserPosition(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      
      // Get total count of players
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Load top 100 entries with tie-breaking: highest_score DESC, then updated_at ASC (earlier achievement ranks higher)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('highest_score', { ascending: false })
        .order('updated_at', { ascending: true, nullsFirst: false })
        .limit(100);

      if (error) throw error;

      // Calculate ranks sequentially (1, 2, 3, 4, 5...)
      // Each player gets a unique rank based on their position in the sorted list
      // Players are sorted by highest_score DESC, then updated_at ASC (earlier achievement ranks higher)
      const leaderboardEntries: LeaderboardEntry[] = (data || []).map((entry, index) => {
        const score = entry.highest_score || 0;
        // Sequential ranking: first entry is rank 1, second is rank 2, etc.
        const rank = index + 1;

        return {
          id: entry.id,
          rank,
          username: entry.username,
          city: entry.city || '',
          country: entry.country || '',
          score,
          level: entry.current_level || 1,
          avatarColor: entry.avatar_color,
          isCurrentUser: currentProfileId === entry.id
        };
      });

      setEntries(leaderboardEntries);

      // Get user's position if they have a profile
      if (currentProfileId) {
        await loadUserPosition(currentProfileId, totalCount || 0, leaderboardEntries);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentProfileId]);

  const loadUserPosition = async (profileId: string, totalPlayers: number, entries: LeaderboardEntry[] = []) => {
    try {
      if (!isSupabaseConfigured) {
        setUserPosition(null);
        return;
      }
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

      const userScore = userProfile.highest_score || 0;

      // Check if user is in the top 100 entries list
      const userInEntries = entries.find(entry => entry.id === profileId);
      if (userInEntries) {
        // Use the rank from the entries list (already calculated with proper tie-breaking)
        const userEntry: LeaderboardEntry = {
          id: userProfile.id,
          rank: userInEntries.rank,
          username: userProfile.username,
          city: userProfile.city || '',
          country: userProfile.country || '',
          score: userScore,
          level: userProfile.current_level || 1,
          avatarColor: userProfile.avatar_color,
          isCurrentUser: true
        };

        setUserPosition({
          rank: userInEntries.rank,
          entry: userEntry,
          totalPlayers
        });
        return;
      }

      // User is not in top 100, calculate their rank properly with tie-breaking
      // Get all profiles ordered by score (DESC) then updated_at (ASC) for tie-breaking
      const { data: allProfiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, highest_score, updated_at, created_at')
        .order('highest_score', { ascending: false })
        .order('updated_at', { ascending: true, nullsFirst: false });

      if (fetchError) {
        console.error('Error fetching all profiles for ranking:', fetchError);
        // Fallback: count players with strictly higher score
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('highest_score', userScore);
        
        const rank = (count || 0) + 1;
        const userEntry: LeaderboardEntry = {
          id: userProfile.id,
          rank,
          username: userProfile.username,
          city: userProfile.city || '',
          country: userProfile.country || '',
          score: userScore,
          level: userProfile.current_level || 1,
          avatarColor: userProfile.avatar_color,
          isCurrentUser: true
        };

        setUserPosition({
          rank,
          entry: userEntry,
          totalPlayers
        });
        return;
      }

      // Calculate rank based on sorted list with sequential ranking
      // Each player gets a unique rank based on their position (1, 2, 3, 4, 5...)
      let calculatedRank = totalPlayers + 1; // Default to last if not found
      let foundUser = false;

      for (let i = 0; i < allProfiles.length; i++) {
        const profile = allProfiles[i];
        
        // Check if this is the user
        if (profile.id === profileId) {
          // Sequential ranking: position in sorted list (0-based index + 1)
          calculatedRank = i + 1;
          foundUser = true;
          break;
        }
      }

      // If user not found (shouldn't happen), keep default rank
      if (!foundUser) {
        calculatedRank = totalPlayers + 1;
      }

      const userEntry: LeaderboardEntry = {
        id: userProfile.id,
        rank: calculatedRank,
        username: userProfile.username,
        city: userProfile.city || '',
        country: userProfile.country || '',
        score: userScore,
        level: userProfile.current_level || 1,
        avatarColor: userProfile.avatar_color,
        isCurrentUser: true
      };

      setUserPosition({
        rank: calculatedRank,
        entry: userEntry,
        totalPlayers
      });
    } catch (error) {
      console.error('Error loading user position:', error);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setEntries([]);
      setUserPosition(null);
      setIsLoading(false);
      return;
    }

    loadLeaderboard();

    // Throttle leaderboard reloads to prevent excessive updates with high user volume
    let reloadTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledReload = () => {
      if (reloadTimeout) return; // Skip if already scheduled
      reloadTimeout = setTimeout(() => {
        loadLeaderboard();
        reloadTimeout = null;
      }, 500); // Reduced throttle to 500ms for faster updates
    };

    // Subscribe to realtime updates for profiles table
    const profilesChannel = supabase
      .channel(`leaderboard-profiles-changes-${currentProfileId || 'global'}`)
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
            throttledReload();
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            throttledReload();
          }
        }
      )
      .subscribe();

    // Subscribe to realtime updates for leaderboard table
    const leaderboardChannel = supabase
      .channel(`leaderboard-scores-changes-${currentProfileId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard'
        },
        () => {
          throttledReload();
        }
      )
      .subscribe();

    return () => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(leaderboardChannel);
    };
  }, [loadLeaderboard, currentProfileId]);

  const submitScore = async (profileId: string, score: number, level: number) => {
    try {
      if (!isSupabaseConfigured) {
        return;
      }
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