import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

/**
 * Hook to handle Android back button
 * Navigates to home page instead of closing the app
 */
export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only handle back button on native platforms (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      let listener: PluginListenerHandle | null = null;

      const setupListener = async () => {
        listener = await App.addListener('backButton', ({ canGoBack }) => {
          // If we're on the home page, exit the app
          if (location.pathname === '/') {
            App.exitApp();
          } else {
            // Otherwise, navigate to home
            navigate('/');
          }
        });
      };

      setupListener();

      return () => {
        listener?.remove();
      };
    }
  }, [navigate, location.pathname]);
};

