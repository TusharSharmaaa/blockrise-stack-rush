import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const hapticImpact = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

export const hapticNotification = async (type: NotificationType = NotificationType.Success) => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type });
  } catch (error) {
    console.warn('Haptic notification not available:', error);
  }
};

export const hapticVibrate = async (duration: number = 100) => {
  if (!isNative) return;
  try {
    await Haptics.vibrate({ duration });
  } catch (error) {
    console.warn('Haptic vibration not available:', error);
  }
};

export const hapticSelectionStart = async () => {
  if (!isNative) return;
  try {
    await Haptics.selectionStart();
  } catch (error) {
    console.warn('Haptic selection not available:', error);
  }
};

export const hapticSelectionChanged = async () => {
  if (!isNative) return;
  try {
    await Haptics.selectionChanged();
  } catch (error) {
    console.warn('Haptic selection changed not available:', error);
  }
};

export const hapticSelectionEnd = async () => {
  if (!isNative) return;
  try {
    await Haptics.selectionEnd();
  } catch (error) {
    console.warn('Haptic selection end not available:', error);
  }
};
