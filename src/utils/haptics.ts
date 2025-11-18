import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const HAPTICS_ENABLED = false;

const canUseHaptics = () => HAPTICS_ENABLED && isNative;

export const hapticImpact = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

export const hapticNotification = async (type: NotificationType = NotificationType.Success) => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.notification({ type });
  } catch (error) {
    console.warn('Haptic notification not available:', error);
  }
};

export const hapticVibrate = async (duration: number = 100) => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.vibrate({ duration });
  } catch (error) {
    console.warn('Haptic vibration not available:', error);
  }
};

export const hapticSelectionStart = async () => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.selectionStart();
  } catch (error) {
    console.warn('Haptic selection not available:', error);
  }
};

export const hapticSelectionChanged = async () => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.selectionChanged();
  } catch (error) {
    console.warn('Haptic selection changed not available:', error);
  }
};

export const hapticSelectionEnd = async () => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.selectionEnd();
  } catch (error) {
    console.warn('Haptic selection end not available:', error);
  }
};
