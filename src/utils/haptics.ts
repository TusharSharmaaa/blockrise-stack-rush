import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const MOVE_PULSE_DURATION_MS = 12;

let hapticsEnabled = true;

const canUseNativeHaptics = () => hapticsEnabled && isNative;
const canUseWebVibration = () =>
  hapticsEnabled &&
  typeof navigator !== 'undefined' &&
  'vibrate' in navigator &&
  typeof navigator.vibrate === 'function';

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
};

export const isHapticsEnabled = () => hapticsEnabled;

export const hapticImpact = (style: ImpactStyle = ImpactStyle.Light) => {
  if (!canUseNativeHaptics()) return;
  // Fire and forget - don't await to avoid blocking
  Haptics.impact({ style }).catch(() => {
    // Silently fail
  });
};

export const hapticNotification = (type: NotificationType = NotificationType.Success) => {
  if (!canUseNativeHaptics()) return;
  // Fire and forget - don't await to avoid blocking
  Haptics.notification({ type }).catch(() => {
    // Silently fail
  });
};

export const hapticVibrate = (duration: number = MOVE_PULSE_DURATION_MS) => {
  if (canUseNativeHaptics()) {
    // Fire and forget - don't await to avoid blocking
    Haptics.vibrate({ duration }).catch(() => {
      // Silently fail
    });
    return;
  }

  if (canUseWebVibration()) {
    try {
      (navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }).vibrate?.(duration);
    } catch (error) {
      // Silently fail
    }
  }
};

export const hapticSelectionStart = () => {
  if (!canUseNativeHaptics()) return;
  // Fire and forget - don't await to avoid blocking
  Haptics.selectionStart().catch(() => {
    // Silently fail
  });
};

export const hapticSelectionChanged = () => {
  if (!canUseNativeHaptics()) return;
  // Fire and forget - don't await to avoid blocking
  Haptics.selectionChanged().catch(() => {
    // Silently fail
  });
};

export const hapticSelectionEnd = () => {
  if (!canUseNativeHaptics()) return;
  // Fire and forget - don't await to avoid blocking
  Haptics.selectionEnd().catch(() => {
    // Silently fail
  });
};
