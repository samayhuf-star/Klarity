// OneSignal remote push for optional "Tips and updates". Daily reminders stay local (expo-notifications).
// Consent comes first: OneSignal starts in consent-required mode and collects nothing until the user
// opts in during onboarding or in Settings (state.pushTips). Default: off.
import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { CONFIG } from './config';

let started = false;

export function applyPushConsent(on: boolean): void {
  if (Platform.OS === 'web' || !CONFIG.oneSignalAppId) return;
  try {
    if (!started) {
      OneSignal.setConsentRequired(true);
      OneSignal.initialize(CONFIG.oneSignalAppId);
      started = true;
    }
    OneSignal.setConsentGiven(on);
    if (on) OneSignal.Notifications.requestPermission(false).catch(() => {});
  } catch {
    // Push is optional; the app works without it.
  }
}
