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
      // Prefer localStorage for fast boot
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
            totalCoins: data.total_coins,
          });
          return;
        }
      }

      // Fallback: check by current authenticated user id
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (uid) {
        const { data: existing, error: existingErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle();

        if (existing && !existingErr) {
          localStorage.setItem('profileId', existing.id);
          setProfile({
            id: existing.id,
            user_id: existing.user_id,
            username: existing.username,
            city: existing.city,
            country: existing.country,
            avatarColor: existing.avatar_color,
            joinedDate: existing.created_at,
            highestScore: existing.highest_score,
            currentLevel: existing.current_level,
            totalCoins: existing.total_coins,
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
      // Ensure we have a user session (anonymous or authenticated)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      let uid = user?.id;

      if (authError || !uid) {
        console.log('[useUserProfile] No user session, creating anonymous user...');
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError || !anonData.user) {
          console.error('[useUserProfile] Anonymous auth error:', anonError);
          throw new Error('Failed to create user session');
        }
        uid = anonData.user.id;
        console.log('[useUserProfile] Anonymous user created:', uid);
      }

      // If a profile already exists for this user, update it instead of inserting
      const { data: existing, error: existingErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      if (existing && !existingErr) {
        // Update minimal fields if necessary and return existing
        const updates: any = {};
        if (!existing.username || existing.username !== name) updates.username = name;
        if (!existing.country || existing.country !== country) updates.country = country;
        if (!existing.avatar_color) updates.avatar_color = avatarColor;

        if (Object.keys(updates).length > 0) {
          const { error: updateErr, data: updated } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', existing.id)
            .select()
            .single();
          
          // Handle username unique constraint violation on update
          if (updateErr) {
            // @ts-ignore
            if (updateErr.code === '23505' && updateErr.message?.includes('profiles_username_unique_idx')) {
              throw new Error('USERNAME_TAKEN');
            }
            throw updateErr;
          }
          
          localStorage.setItem('profileId', updated.id);
          const updatedProfile: UserProfile = {
            id: updated.id,
            user_id: updated.user_id,
            username: updated.username,
            city: updated.city,
            country: updated.country,
            avatarColor: updated.avatar_color,
            joinedDate: updated.created_at,
            highestScore: updated.highest_score,
            currentLevel: updated.current_level,
            totalCoins: updated.total_coins,
          };
          setProfile(updatedProfile);
          return updatedProfile;
        }

        // No updates needed; just set and return
        localStorage.setItem('profileId', existing.id);
        const existingProfile: UserProfile = {
          id: existing.id,
          user_id: existing.user_id,
          username: existing.username,
          city: existing.city,
          country: existing.country,
          avatarColor: existing.avatar_color,
          joinedDate: existing.created_at,
          highestScore: existing.highest_score,
          currentLevel: existing.current_level,
          totalCoins: existing.total_coins,
        };
        setProfile(existingProfile);
        return existingProfile;
      }

      // Create new profile (safe upsert in case of race)
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: uid,
          username: name,
          city: '',
          country: country,
          avatar_color: avatarColor,
          highest_score: 0,
          current_level: 1,
          total_coins: 0,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        // @ts-ignore
        if (error.code === '23505') {
          // Check if it's a username conflict
          // @ts-ignore
          if (error.message?.includes('profiles_username_unique_idx')) {
            throw new Error('USERNAME_TAKEN');
          }
          // Otherwise it's a user_id conflict, fetch existing
          const { data: fetched } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', uid)
            .single();
          if (fetched) {
            localStorage.setItem('profileId', fetched.id);
            const fetchedProfile: UserProfile = {
              id: fetched.id,
              user_id: fetched.user_id,
              username: fetched.username,
              city: fetched.city,
              country: fetched.country,
              avatarColor: fetched.avatar_color,
              joinedDate: fetched.created_at,
              highestScore: fetched.highest_score,
              currentLevel: fetched.current_level,
              totalCoins: fetched.total_coins,
            };
            setProfile(fetchedProfile);
            return fetchedProfile;
          }
        }
        console.error('[useUserProfile] Insert/upsert error:', error);
        throw error;
      }

      const newProfile: UserProfile = {
        id: data.id,
        user_id: data.user_id,
        username: data.username,
        city: data.city,
        country: data.country,
        avatarColor: data.avatar_color,
        joinedDate: data.created_at,
        highestScore: data.highest_score ?? 0,
        currentLevel: data.current_level ?? 1,
        totalCoins: data.total_coins ?? 0,
      };

      localStorage.setItem('profileId', data.id);
      setProfile(newProfile);
      return newProfile;
    } catch (error: any) {
      // Normalize error messages for UI
      const msg = String(error?.message || '');
      
      if (msg === 'USERNAME_TAKEN') {
        throw new Error('USERNAME_TAKEN');
      }
      
      if (msg.includes('duplicate key value') || msg.includes('profiles_user_id_key')) {
        throw new Error('You already have a profile. Please try again.');
      }
      
      if (msg.includes('profiles_username_unique_idx')) {
        throw new Error('USERNAME_TAKEN');
      }
      
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

  const canChangeUsername = (
    currentLevel: number
  ): { canChange: boolean; reason?: string; changeNumber?: number } => {
    const firstChangeUsed = localStorage.getItem('username_change_level_5') === 'true';
    const legacySecondChange = localStorage.getItem('username_change_level_15') === 'true';
    const secondChangeUsed =
      legacySecondChange || localStorage.getItem('username_change_level_20') === 'true';

    // Migrate legacy flag to new storage key if needed
    if (legacySecondChange && !localStorage.getItem('username_change_level_20')) {
      localStorage.setItem('username_change_level_20', 'true');
    }

    if (currentLevel >= 5 && !firstChangeUsed) {
      return {
        canChange: true,
        reason: 'Level 5 reached — you can update your username once (change 1 of 2).',
        changeNumber: 1,
      };
    }

    if (currentLevel >= 20 && !secondChangeUsed) {
      return {
        canChange: true,
        reason: 'Level 20 reached — final username change unlocked (change 2 of 2).',
        changeNumber: 2,
      };
    }

    if (!firstChangeUsed && currentLevel < 5) {
      return {
        canChange: false,
        reason: `Reach level 5 to unlock your first name change (current level: ${currentLevel}).`,
      };
    }

    if (firstChangeUsed && !secondChangeUsed) {
      if (currentLevel < 20) {
        return {
          canChange: false,
          reason: `Reach level 20 to unlock your final name change (current level: ${currentLevel}).`,
        };
      }
    }

    return {
      canChange: false,
      reason: 'You have used all available username changes.',
    };
  };
  
  const recordUsernameChange = (level: number) => {
    const firstChangeUsed = localStorage.getItem('username_change_level_5') === 'true';
    const secondChangeUsed = localStorage.getItem('username_change_level_20') === 'true';

    if (!firstChangeUsed && level >= 5) {
      localStorage.setItem('username_change_level_5', 'true');
      return;
    }

    if (!secondChangeUsed && level >= 20) {
      localStorage.setItem('username_change_level_20', 'true');
      localStorage.removeItem('username_change_level_15');
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

  return { 
    profile, 
    isLoading, 
    createProfile, 
    updateProfile, 
    checkNameUnique,
    canChangeUsername,
    recordUsernameChange,
  };
};
