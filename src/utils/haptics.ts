import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const HAPTICS_ENABLED = true;
const MOVE_PULSE_DURATION_MS = 12;

const canUseNativeHaptics = () => HAPTICS_ENABLED && isNative;
const canUseWebVibration = () =>
  typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';

export const hapticImpact = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (!canUseNativeHaptics()) return;
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

export const hapticNotification = async (type: NotificationType = NotificationType.Success) => {
  if (!canUseNativeHaptics()) return;
  try {
    await Haptics.notification({ type });
  } catch (error) {
    console.warn('Haptic notification not available:', error);
  }
};

export const hapticVibrate = async (duration: number = MOVE_PULSE_DURATION_MS) => {
  if (canUseNativeHaptics()) {
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.warn('Haptic vibration not available:', error);
    }
    return;
  }

  if (canUseWebVibration()) {
    try {
      (navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }).vibrate?.(duration);
    } catch (error) {
      console.warn('Web vibration not available:', error);
    }
  }
};

export const hapticSelectionStart = async () => {
  if (!canUseNativeHaptics()) return;
  try {
    await Haptics.selectionStart();
  } catch (error) {
    console.warn('Haptic selection not available:', error);
  }
};

export const hapticSelectionChanged = async () => {
  if (!canUseNativeHaptics()) return;
  try {
    await Haptics.selectionChanged();
  } catch (error) {
    console.warn('Haptic selection changed not available:', error);
  }
};

export const hapticSelectionEnd = async () => {
  if (!canUseNativeHaptics()) return;
  try {
    await Haptics.selectionEnd();
  } catch (error) {
    console.warn('Haptic selection end not available:', error);
  }
};
