import { useEffect, useRef, useState } from 'react';
import { Preferences } from '@capacitor/preferences';

interface SoundSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
}

const SOUND_URLS = {
  move: '/sounds/move.mp3',
  rotate: '/sounds/rotate.mp3',
  drop: '/sounds/drop.mp3',
  lineClear: '/sounds/line-clear.mp3',
  levelUp: '/sounds/level-up.mp3',
  gameOver: '/sounds/game-over.mp3',
  achievement: '/sounds/achievement.mp3',
  coin: '/sounds/coin.mp3',
  powerup: '/sounds/powerup.mp3',
  bgMusic: '/sounds/bg-music.mp3'
};

export const useSound = () => {
  const [settings, setSettings] = useState<SoundSettings>({
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.7
  });

  const soundsRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadSettings();
    initializeSounds();
  }, []);

  const loadSettings = async () => {
    try {
      const { value: soundEnabled } = await Preferences.get({ key: 'soundEnabled' });
      const { value: musicEnabled } = await Preferences.get({ key: 'musicEnabled' });
      const { value: volume } = await Preferences.get({ key: 'volume' });

      setSettings({
        soundEnabled: soundEnabled === null ? true : soundEnabled === 'true',
        musicEnabled: musicEnabled === null ? true : musicEnabled === 'true',
        volume: volume ? parseFloat(volume) : 0.7
      });
    } catch (error) {
      console.error('Failed to load sound settings:', error);
    }
  };

  const initializeSounds = () => {
    // Initialize sound effects
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      if (key !== 'bgMusic') {
        const audio = new Audio(url);
        audio.volume = settings.volume;
        audio.preload = 'auto';
        // Handle loading errors gracefully
        audio.onerror = () => console.warn(`Sound file not found: ${url}`);
        soundsRef.current[key] = audio;
      }
    });

    // Initialize background music
    const bgMusic = new Audio(SOUND_URLS.bgMusic);
    bgMusic.volume = settings.volume * 0.3; // Lower volume for BG music
    bgMusic.loop = true;
    bgMusic.preload = 'auto';
    bgMusic.onerror = () => console.warn('BG music file not found');
    musicRef.current = bgMusic;
  };

  const playSound = (soundName: keyof typeof SOUND_URLS) => {
    if (!settings.soundEnabled || soundName === 'bgMusic') return;

    const sound = soundsRef.current[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.volume = settings.volume;
      sound.play().catch(() => {
        // Silently fail if sound can't play (e.g., user hasn't interacted yet)
      });
    }
  };

  const playMusic = () => {
    if (!settings.musicEnabled || !musicRef.current) return;

    musicRef.current.volume = settings.volume * 0.3;
    musicRef.current.play().catch(() => {
      // Silently fail if music can't play
    });
  };

  const stopMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  };

  const toggleSound = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, soundEnabled: enabled }));
    await Preferences.set({ key: 'soundEnabled', value: String(enabled) });
  };

  const toggleMusic = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, musicEnabled: enabled }));
    await Preferences.set({ key: 'musicEnabled', value: String(enabled) });
    
    if (enabled) {
      playMusic();
    } else {
      stopMusic();
    }
  };

  const setVolume = async (volume: number) => {
    setSettings(prev => ({ ...prev, volume }));
    await Preferences.set({ key: 'volume', value: String(volume) });

    // Update all sound volumes
    Object.values(soundsRef.current).forEach(sound => {
      sound.volume = volume;
    });

    if (musicRef.current) {
      musicRef.current.volume = volume * 0.3;
    }
  };

  return {
    settings,
    playSound,
    playMusic,
    stopMusic,
    toggleSound,
    toggleMusic,
    setVolume
  };
};
