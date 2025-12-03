import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { sanitizeUsername } from '@/utils/validation';

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
  isOffline?: boolean;
  offlineReason?: string;
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

const OFFLINE_PROFILE_STORAGE_KEY = 'blockrise_offline_profile_v1';

const generateLocalProfileId = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const readOfflineProfile = (): UserProfile | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(OFFLINE_PROFILE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch (error) {
    console.error('[useUserProfile] Failed to parse offline profile from storage:', error);
    return null;
  }
};

const persistOfflineProfile = (profile: UserProfile) => {
  if (typeof localStorage === 'undefined') return;
  const id = profile.id || generateLocalProfileId();
  const profileWithId = { ...profile, id };
  localStorage.setItem(OFFLINE_PROFILE_STORAGE_KEY, JSON.stringify(profileWithId));
  localStorage.setItem('profileId', profileWithId.id);
  localStorage.setItem('blockrise_profile_complete', 'true');
};

const clearOfflineProfile = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(OFFLINE_PROFILE_STORAGE_KEY);
};

const isLikelyNetworkIssue = (error?: unknown) => {
  if (!error) {
    return !isSupabaseConfigured;
  }
  const message = String((error as any)?.message || error || '').toLowerCase();
  if (!message) return !isSupabaseConfigured;
  const indicators = [
    'failed to fetch',
    'network request failed',
    'fetch failed',
    'networkerror',
    'connection refused',
    'typeerror: failed to fetch',
    'timeout',
  ];
  return indicators.some((indicator) => message.includes(indicator));
};

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateOfflineProfile = (context?: string) => {
    const offlineProfile = readOfflineProfile();
    if (offlineProfile) {
      if (context) {
        console.warn('[useUserProfile] Using offline profile:', context);
      }
      setProfile(offlineProfile);
      return true;
    }
    return false;
  };

  const buildOfflineProfile = (name: string, country: string, reason?: string): UserProfile => {
    const existingId =
      typeof localStorage === 'undefined' ? null : localStorage.getItem('profileId');
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    return {
      id: existingId || generateLocalProfileId(),
      user_id: undefined,
      username: name,
      city: '',
      country,
      avatarColor,
      joinedDate: new Date().toISOString(),
      highestScore: 0,
      currentLevel: 1,
      totalCoins: 0,
      isOffline: true,
      offlineReason: reason,
    };
  };

  const createOfflineProfile = (name: string, country: string, reason?: string) => {
    console.warn('[useUserProfile] Falling back to offline profile mode:', reason || 'Unknown reason');
    const offlineProfile = buildOfflineProfile(name, country, reason);
    persistOfflineProfile(offlineProfile);
    setProfile(offlineProfile);
    return offlineProfile;
  };

  const loadProfile = useCallback(async () => {
    try {
      if (!isSupabaseConfigured) {
        hydrateOfflineProfile('Supabase environment missing');
        return;
      }

      // Prefer localStorage for fast boot
      const localId = localStorage.getItem('profileId');

      if (localId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', localId)
          .single();

        if (data && !error && data.username) {
          // Valid profile with username exists
          clearOfflineProfile();
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
        } else {
          // Invalid profile or missing username - clear localStorage
          console.log('[useUserProfile] Invalid profile in localStorage, clearing...');
          localStorage.removeItem('profileId');
          localStorage.removeItem('blockrise_profile_complete');
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

        if (existing && !existingErr && existing.username) {
          // Valid profile with username exists
          localStorage.setItem('profileId', existing.id);
          clearOfflineProfile();
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
        } else if (existing && !existing.username) {
          // Profile exists but has no username - clear invalid profile flag
          console.log('[useUserProfile] Profile exists but missing username, clearing localStorage...');
          localStorage.removeItem('profileId');
          localStorage.removeItem('blockrise_profile_complete');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      const offlineLoaded = hydrateOfflineProfile('Failed to load profile from Supabase');
      if (offlineLoaded) {
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Listen for progress sync events and refresh profile
  useEffect(() => {
    const handleProgressSynced = () => {
      // Refresh profile from Supabase when progress is synced
      if (profile?.id && !profile.isOffline && isSupabaseConfigured) {
        loadProfile();
      }
    };

    window.addEventListener('progressSynced', handleProgressSynced);
    return () => window.removeEventListener('progressSynced', handleProgressSynced);
  }, [profile?.id, profile?.isOffline, loadProfile]);

  // Subscribe to real-time profile updates from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !profile?.id || profile.isOffline) {
      return;
    }

    const channel = supabase
      .channel(`profile-updates-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`
        },
        (payload) => {
          // Refresh profile when it's updated in Supabase
          if (payload.new) {
            const updatedProfile: UserProfile = {
              id: payload.new.id,
              user_id: payload.new.user_id,
              username: payload.new.username,
              city: payload.new.city || '',
              country: payload.new.country || '',
              avatarColor: payload.new.avatar_color,
              joinedDate: payload.new.created_at,
              highestScore: payload.new.highest_score,
              currentLevel: payload.new.current_level,
              totalCoins: payload.new.total_coins,
            };
            setProfile(updatedProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.isOffline]);

  const createProfile = async (name: string, country: string) => {
    console.log('[useUserProfile] Creating profile:', { name, country });
    if (!isSupabaseConfigured) {
      return createOfflineProfile(name, country, 'Supabase environment missing');
    }
    try {
      // Ensure we have a user session (anonymous or authenticated)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      let uid = user?.id;

      if (authError || !uid) {
        console.log('[useUserProfile] No user session, creating anonymous user...');
        try {
          const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
          if (anonError) {
            console.error('[useUserProfile] Anonymous auth error:', anonError);
            // Provide helpful error message
            if (anonError.message?.includes('disabled') || anonError.message?.includes('not enabled')) {
              throw new Error('Anonymous authentication is not enabled in Supabase. Please enable it in Authentication > Providers > Email settings.');
            }
            if (isLikelyNetworkIssue(anonError)) {
              return createOfflineProfile(name, country, anonError.message || 'Supabase unavailable');
            }
            throw new Error(`Failed to create user session: ${anonError.message || 'Unknown error'}`);
          }
          if (!anonData?.user) {
            throw new Error('Failed to create user session: No user returned');
          }
          uid = anonData.user.id;
          console.log('[useUserProfile] Anonymous user created:', uid);
        } catch (error: any) {
          console.error('[useUserProfile] Error creating anonymous session:', error);
          if (isLikelyNetworkIssue(error)) {
            return createOfflineProfile(name, country, error?.message || 'Supabase unavailable');
          }
          throw error instanceof Error ? error : new Error('Failed to create user session');
        }
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
          clearOfflineProfile();
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
        clearOfflineProfile();
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
            clearOfflineProfile();
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
      clearOfflineProfile();
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

      if (isLikelyNetworkIssue(error)) {
        return createOfflineProfile(name, country, msg || 'Supabase unavailable');
      }
      
      console.error('[useUserProfile] Error creating profile:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile?.id) return;

    if (profile.isOffline || !isSupabaseConfigured) {
      const updatedProfile = { ...profile, ...updates, isOffline: true };
      persistOfflineProfile(updatedProfile);
      setProfile(updatedProfile);
      return;
    }

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
    const normalizedName = sanitizeUsername(name);
    if (!normalizedName) {
      return false;
    }
    console.log('[useUserProfile] Checking name uniqueness:', { name: normalizedName, currentUserId });
    try {
      // Use case-insensitive match with LOWER() to match the database index
      // Query all profiles with matching username (case-insensitive)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username')
        .ilike('username', normalizedName);

      if (error) {
        console.error('[useUserProfile] Error checking name:', error);
        // If it's a permission error, we might not be authenticated yet - that's ok for new users
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.log('[useUserProfile] Permission error, assuming username available (new user)');
          return true;
        }
        throw error;
      }
      
      // Log what we found for debugging
      console.log('[useUserProfile] Query result:', { 
        searchedFor: normalizedName, 
        foundCount: data?.length || 0,
        matches: data?.map(d => ({ id: d.id, username: d.username, user_id: d.user_id }))
      });
      
      // If no matches found, username is available
      if (!data || data.length === 0) {
        console.log('[useUserProfile] ✅ Username available:', normalizedName);
        return true;
      }
      
      // If editing own profile and name matches current, it's available
      if (data.length === 1 && currentUserId && data[0].user_id === currentUserId) {
        console.log('[useUserProfile] ✅ Name matches current user profile - available');
        return true;
      }
      
      // Username is taken by another user
      console.log('[useUserProfile] ❌ Username taken:', normalizedName, 'found in database:', {
        username: data[0]?.username,
        profileId: data[0]?.id,
        userId: data[0]?.user_id,
        currentUserId: currentUserId
      });
      return false;
    } catch (error) {
      console.error('[useUserProfile] Error checking name uniqueness:', error);
      // On error, assume available to allow users to proceed (will fail on insert if truly taken)
      return true;
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
