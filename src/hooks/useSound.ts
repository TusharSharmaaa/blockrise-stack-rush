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
} as const;

type SoundName = keyof typeof SOUND_URLS;

const SOUND_FREQUENCIES: Record<SoundName, number> = {
  move: 520,
  rotate: 620,
  drop: 440,
  lineClear: 700,
  levelUp: 880,
  gameOver: 260,
  achievement: 960,
  coin: 1040,
  powerup: 800,
  bgMusic: 220
};

const AUDIO_DISABLED = true;

const getDisabledSettings = (): SoundSettings => ({
  soundEnabled: false,
  musicEnabled: false,
  volume: 0
});

export const useSound = () => {
  const [settings, setSettings] = useState<SoundSettings>(() =>
    AUDIO_DISABLED
      ? getDisabledSettings()
      : {
          soundEnabled: true,
          musicEnabled: true,
          volume: 0.7
        }
  );

  const soundsRef = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({});
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fallbackMusicRef = useRef<OscillatorNode | null>(null);
  const fallbackMusicGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (AUDIO_DISABLED) {
      setSettings(getDisabledSettings());
      return;
    }

    let isMounted = true;

    const loadSettingsFromStorage = async () => {
      try {
        const [{ value: soundEnabled }, { value: musicEnabled }, { value: volume }] = await Promise.all([
          Preferences.get({ key: 'soundEnabled' }),
          Preferences.get({ key: 'musicEnabled' }),
          Preferences.get({ key: 'volume' })
        ]);

        if (!isMounted) {
          return;
        }

        const parsedSettings: SoundSettings = {
          soundEnabled: soundEnabled === null ? true : soundEnabled === 'true',
          musicEnabled: musicEnabled === null ? true : musicEnabled === 'true',
          volume: volume ? parseFloat(volume) : 0.7
        };

        setSettings(parsedSettings);

        if (typeof Audio === 'undefined') {
          console.warn('HTMLAudioElement is not available; using synthesized fallbacks.');
          return;
        }

        const initializedSounds: Partial<Record<SoundName, HTMLAudioElement>> = {};
        Object.entries(SOUND_URLS).forEach(([key, url]) => {
          if (key === 'bgMusic') {
            return;
          }
          const audio = new Audio(url);
          audio.volume = parsedSettings.volume;
          audio.preload = 'auto';
          audio.onerror = () => {
            console.warn(`Sound file not found: ${url}. Falling back to synthesized tone.`);
            initializedSounds[key as SoundName] = undefined;
          };
          initializedSounds[key as SoundName] = audio;
        });

        soundsRef.current = initializedSounds;

        const bgMusic = new Audio(SOUND_URLS.bgMusic);
        bgMusic.volume = parsedSettings.volume * 0.3;
        bgMusic.loop = true;
        bgMusic.preload = 'auto';
        bgMusic.onerror = () => {
          console.warn('Background music file not found. Using synthesized fallback.');
          musicRef.current = null;
        };
        musicRef.current = bgMusic;
      } catch (error) {
        console.error('Failed to load sound settings:', error);
      }
    };

    loadSettingsFromStorage();

    return () => {
      isMounted = false;
      Object.values(soundsRef.current).forEach(sound => {
        sound?.pause();
      });
      soundsRef.current = {};
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      if (fallbackMusicRef.current) {
        fallbackMusicRef.current.stop();
        fallbackMusicRef.current.disconnect();
        fallbackMusicRef.current = null;
      }
      fallbackMusicGainRef.current?.disconnect();
      fallbackMusicGainRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const getAudioContext = () => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!audioContextRef.current) {
      const extendedWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioCtor = extendedWindow.AudioContext || extendedWindow.webkitAudioContext;
      if (!AudioCtor) {
        return null;
      }
      audioContextRef.current = new AudioCtor();
    }
    return audioContextRef.current;
  };

  const playFallbackTone = (soundName: SoundName) => {
    if (AUDIO_DISABLED) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const isMusic = soundName === 'bgMusic';

    oscillator.type = isMusic ? 'sine' : 'triangle';
    oscillator.frequency.value = SOUND_FREQUENCIES[soundName] || 440;
    gain.gain.value = isMusic ? settings.volume * 0.2 : settings.volume;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + (isMusic ? 2.5 : 0.2));
  };

  const startFallbackMusic = () => {
    if (AUDIO_DISABLED) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) return;

    stopFallbackMusic();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = SOUND_FREQUENCIES.bgMusic;
    gain.gain.value = settings.volume * 0.2;
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    fallbackMusicRef.current = oscillator;
    fallbackMusicGainRef.current = gain;
  };

  const stopFallbackMusic = () => {
    if (fallbackMusicRef.current) {
      fallbackMusicRef.current.stop();
      fallbackMusicRef.current.disconnect();
      fallbackMusicRef.current = null;
    }
    if (fallbackMusicGainRef.current) {
      fallbackMusicGainRef.current.disconnect();
      fallbackMusicGainRef.current = null;
    }
  };

  const playSound = (soundName: keyof typeof SOUND_URLS) => {
    if (AUDIO_DISABLED || !settings.soundEnabled || soundName === 'bgMusic') return;

    const sound = soundsRef.current[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.volume = settings.volume;
      sound.play().catch(() => {
        // Silently fail if sound can't play (e.g., user hasn't interacted yet)
      });
      return;
    }

    playFallbackTone(soundName);
  };

  const playMusic = () => {
    if (AUDIO_DISABLED || !settings.musicEnabled) return;

    if (musicRef.current) {
      musicRef.current.volume = settings.volume * 0.3;
      musicRef.current.play().catch(() => {
        // Silently fail if music can't play
      });
      return;
    }

    startFallbackMusic();
  };

  const stopMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
    stopFallbackMusic();
  };

  const toggleSound = async (enabled: boolean) => {
    if (AUDIO_DISABLED) {
      setSettings(getDisabledSettings());
      await Preferences.set({ key: 'soundEnabled', value: 'false' });
      return;
    }
    setSettings(prev => ({ ...prev, soundEnabled: enabled }));
    await Preferences.set({ key: 'soundEnabled', value: String(enabled) });
  };

  const toggleMusic = async (enabled: boolean) => {
    if (AUDIO_DISABLED) {
      setSettings(getDisabledSettings());
      await Preferences.set({ key: 'musicEnabled', value: 'false' });
      return;
    }
    setSettings(prev => ({ ...prev, musicEnabled: enabled }));
    await Preferences.set({ key: 'musicEnabled', value: String(enabled) });
    
    if (enabled) {
      playMusic();
    } else {
      stopMusic();
    }
  };

  const setVolume = async (volume: number) => {
    if (AUDIO_DISABLED) {
      const disabledSettings = getDisabledSettings();
      setSettings(disabledSettings);
      await Preferences.set({ key: 'volume', value: String(disabledSettings.volume) });
      return;
    }
    setSettings(prev => ({ ...prev, volume }));
    await Preferences.set({ key: 'volume', value: String(volume) });

    // Update all sound volumes
    Object.values(soundsRef.current).forEach(sound => {
      if (sound) {
        sound.volume = volume;
      }
    });

    if (musicRef.current) {
      musicRef.current.volume = volume * 0.3;
    } else if (fallbackMusicGainRef.current) {
      fallbackMusicGainRef.current.gain.value = volume * 0.2;
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
