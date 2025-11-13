import { useEffect, useState } from 'react';

type FontScale = 'small' | 'medium' | 'large' | 'extra-large';

export const useFontScaling = () => {
  const [fontScale, setFontScale] = useState<FontScale>('medium');

  useEffect(() => {
    // Detect system font size preference
    const detectFontScale = () => {
      // Check for browser zoom/text size
      const baseFontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );

      // Detect preferred font scale from system
      if (baseFontSize <= 14) {
        return 'small';
      } else if (baseFontSize >= 20) {
        return 'extra-large';
      } else if (baseFontSize >= 18) {
        return 'large';
      }
      return 'medium';
    };

    const updateScale = () => {
      const scale = detectFontScale();
      setFontScale(scale);
      document.documentElement.setAttribute('data-font-scale', scale);
    };

    // Initial check
    updateScale();

    // Listen for font size changes (via browser zoom or accessibility settings)
    const observer = new MutationObserver(updateScale);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Also listen for viewport size changes
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const setCustomScale = (scale: FontScale) => {
    setFontScale(scale);
    document.documentElement.setAttribute('data-font-scale', scale);
    localStorage.setItem('font-scale-preference', scale);
  };

  return { fontScale, setCustomScale };
};
