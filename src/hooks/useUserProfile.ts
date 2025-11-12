import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id?: string;
  user_id?: string;
  username: string;
  city: string;
  country: string;
  avatarColor: string;
  joinedDate: string;
  highestScore?: number;
  currentLevel?: number;
  totalCoins?: number;
}

export const AVATAR_COLORS = [
  'hsl(340, 82%, 52%)',
  'hsl(291, 64%, 42%)',
  'hsl(262, 52%, 47%)',
  'hsl(231, 48%, 48%)',
  'hsl(207, 90%, 54%)',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8'
];

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // First check localStorage for profile ID
      const localId = localStorage.getItem('profileId');
      
      if (localId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', localId)
          .single();

        if (data && !error) {
          setProfile({
            id: data.id,
            user_id: data.user_id,
            username: data.username,
            city: data.city,
            country: data.country,
            avatarColor: data.avatar_color,
            joinedDate: data.created_at,
            highestScore: data.highest_score,
            currentLevel: data.current_level,
            totalCoins: data.total_coins
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (name: string, country: string) => {
    console.log('[useUserProfile] Creating profile:', { name, country });
    try {
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          username: name,
          city: '',
          country: country,
          avatar_color: avatarColor,
          highest_score: 0,
          current_level: 1,
          total_coins: 0
        })
        .select()
        .single();

      if (error) {
        console.error('[useUserProfile] Insert error:', error);
        throw error;
      }
      
      console.log('[useUserProfile] Profile created in DB:', data.id);

      const newProfile: UserProfile = {
        id: data.id,
        user_id: data.user_id,
        username: data.username,
        city: data.city,
        country: data.country,
        avatarColor: data.avatar_color,
        joinedDate: data.created_at,
        highestScore: 0,
        currentLevel: 1,
        totalCoins: 0
      };

      localStorage.setItem('profileId', data.id);
      console.log('[useUserProfile] Profile saved to localStorage');
      setProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error('[useUserProfile] Error creating profile:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile?.id) return;

    try {
      const dbUpdates: any = {};
      if (updates.username) dbUpdates.username = updates.username;
      if (updates.city) dbUpdates.city = updates.city;
      if (updates.country) dbUpdates.country = updates.country;
      if (updates.avatarColor) dbUpdates.avatar_color = updates.avatarColor;
      if (updates.highestScore !== undefined) dbUpdates.highest_score = updates.highestScore;
      if (updates.currentLevel !== undefined) dbUpdates.current_level = updates.currentLevel;
      if (updates.totalCoins !== undefined) dbUpdates.total_coins = updates.totalCoins;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', profile.id);

      if (error) throw error;

      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      
      // Also submit score to leaderboard if highest score was updated
      if (updates.highestScore !== undefined && updates.highestScore > (profile.highestScore || 0)) {
        await supabase
          .from('leaderboard')
          .insert({
            profile_id: profile.id,
            score: updates.highestScore,
            level: updates.currentLevel || profile.currentLevel || 1
          });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const checkNameUnique = async (name: string, currentUserId?: string): Promise<boolean> => {
    console.log('[useUserProfile] Checking name uniqueness:', { name, currentUserId });
    try {
      let query = supabase
        .from('profiles')
        .select('id, user_id')
        .ilike('username', name);

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[useUserProfile] Error checking name:', error);
        throw error;
      }
      
      // If editing own profile and name matches current, it's available
      if (data && currentUserId && data.user_id === currentUserId) {
        console.log('[useUserProfile] Name matches current user profile');
        return true;
      }
      
      const isAvailable = !data;
      console.log('[useUserProfile] Name availability:', isAvailable);
      return isAvailable; // If no data, name is available
    } catch (error) {
      console.error('[useUserProfile] Error checking name uniqueness:', error);
      return false; // Assume not unique on error to be safe
    }
  };

  return { profile, isLoading, createProfile, updateProfile, checkNameUnique };
};
