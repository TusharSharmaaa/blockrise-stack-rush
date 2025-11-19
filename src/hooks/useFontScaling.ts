import { useEffect, useState } from 'react';

type FontScale = 'small' | 'medium' | 'large' | 'extra-large';

export const useFontScaling = () => {
  // Initialize from localStorage if available, otherwise default to 'medium'
  const [fontScale, setFontScale] = useState<FontScale>(() => {
    const saved = localStorage.getItem('font-scale-preference');
    if (saved && ['small', 'medium', 'large', 'extra-large'].includes(saved)) {
      return saved as FontScale;
    }
    return 'medium';
  });

  useEffect(() => {
    // Apply saved preference on mount
    const saved = localStorage.getItem('font-scale-preference');
    if (saved && ['small', 'medium', 'large', 'extra-large'].includes(saved)) {
      const savedScale = saved as FontScale;
      setFontScale(savedScale);
      document.documentElement.setAttribute('data-font-scale', savedScale);
      return;
    }

    // For new installs, default to 'medium' (don't detect from system)
    // Apply the default medium scale
    setFontScale('medium');
    document.documentElement.setAttribute('data-font-scale', 'medium');
  }, []);

  const setCustomScale = (scale: FontScale) => {
    setFontScale(scale);
    document.documentElement.setAttribute('data-font-scale', scale);
    localStorage.setItem('font-scale-preference', scale);
  };

  return { fontScale, setCustomScale };
};
