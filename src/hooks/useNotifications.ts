import { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
    checkPermissions();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const { value } = await Preferences.get({ key: 'notificationsEnabled' });
      setNotificationsEnabled(value !== 'false');
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const result = await LocalNotifications.checkPermissions();
      setPermissionGranted(result.display === 'granted');
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const result = await LocalNotifications.requestPermissions();
      setPermissionGranted(result.display === 'granted');
      return result.display === 'granted';
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await Preferences.set({
      key: 'notificationsEnabled',
      value: enabled.toString()
    });

    if (enabled) {
      await scheduleDefaultNotifications();
    } else {
      await cancelAllNotifications();
    }
  };

  const scheduleDefaultNotifications = async () => {
    if (!permissionGranted || !notificationsEnabled) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🎮 Come back and play!',
            body: 'Your daily rewards are waiting! Complete your streak.',
            id: 1,
            schedule: {
              at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            smallIcon: 'ic_notification',
          },
          {
            title: '🔥 Keep your streak alive!',
            body: 'Don\'t break your daily streak! Play now.',
            id: 2,
            schedule: {
              at: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            smallIcon: 'ic_notification',
          },
          {
            title: '🏆 New level unlocked!',
            body: 'Check out the new challenges waiting for you.',
            id: 3,
            schedule: {
              at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
            },
            sound: 'default',
            smallIcon: 'ic_notification',
          }
        ]
      });
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  };

  const scheduleCustomNotification = async (title: string, body: string, delayMs: number) => {
    if (!permissionGranted || !notificationsEnabled) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 10000),
            schedule: {
              at: new Date(Date.now() + delayMs)
            },
            sound: 'default',
            smallIcon: 'ic_notification',
          }
        ]
      });
    } catch (error) {
      console.error('Failed to schedule custom notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  };

  return {
    permissionGranted,
    notificationsEnabled,
    requestPermissions,
    toggleNotifications,
    scheduleCustomNotification
  };
};
