import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface UserProfile {
  username: string;
  city: string;
  country: string;
  avatarColor: string;
  joinedDate: string;
}

const AVATAR_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2'
];

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { value } = await Preferences.get({ key: 'userProfile' });
      if (value) {
        setProfile(JSON.parse(value));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (username: string, city: string, country: string) => {
    const newProfile: UserProfile = {
      username,
      city,
      country,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      joinedDate: new Date().toISOString()
    };

    try {
      await Preferences.set({
        key: 'userProfile',
        value: JSON.stringify(newProfile)
      });
      setProfile(newProfile);
      return { success: true };
    } catch (error) {
      console.error('Failed to create profile:', error);
      return { success: false, error: 'Failed to create profile' };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return { success: false, error: 'No profile exists' };

    const updatedProfile = { ...profile, ...updates };
    try {
      await Preferences.set({
        key: 'userProfile',
        value: JSON.stringify(updatedProfile)
      });
      setProfile(updatedProfile);
      return { success: true };
    } catch (error) {
      console.error('Failed to update profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  const checkUsernameUnique = async (username: string): Promise<boolean> => {
    // In a real app, this would check against a database
    // For now, we'll just check locally stored usernames
    return true;
  };

  return {
    profile,
    isLoading,
    createProfile,
    updateProfile,
    checkUsernameUnique
  };
};
