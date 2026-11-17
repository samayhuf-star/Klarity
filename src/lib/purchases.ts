import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { CONFIG } from './config';

let configured = false;
let plus = false;
const listeners = new Set<() => void>();

function setPlus(v: boolean) {
  plus = v;
  listeners.forEach((l) => l());
}

function fromInfo(info: CustomerInfo): boolean {
  const active = Boolean(info.entitlements.active[CONFIG.entitlementId]);
  setPlus(active);
  return active;
}

const apiKey = () => (Platform.OS === 'ios' ? CONFIG.revenueCatIosKey : Platform.OS === 'android' ? CONFIG.revenueCatAndroidKey : '');

export const purchasesReady = () => configured;

export async function initPurchases() {
  if (configured || Platform.OS === 'web' || !apiKey()) return;
  try {
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: apiKey() });
    configured = true;
    Purchases.addCustomerInfoUpdateListener(fromInfo);
    fromInfo(await Purchases.getCustomerInfo());
    // Attribution for Apple Search Ads, no user prompt needed.
    if (Platform.OS === 'ios') void Purchases.enableAdServicesAttributionTokenCollection();
    void Purchases.setAttributes({ app_free_limit: String(CONFIG.freeAppLimit) });
  } catch {
    configured = false;
    // Offline or not yet configured: the free core keeps working.
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function usePlus(): boolean {
  return useSyncExternalStore(subscribe, () => plus, () => false);
}

/** Set a subscriber attribute such as rules_count so RevenueCat audiences can target power users. */
export function setUserAttribute(key: string, value: string | null) {
  if (!configured) return;
  void Purchases.setAttributes({ [key]: value });
}

export async function restore(): Promise<boolean> {
  if (!configured) await initPurchases();
  if (!configured) return false;
  return fromInfo(await Purchases.restorePurchases());
}

/** Opens RevenueCat Customer Center (manage or cancel, refunds, support). */
export async function openCustomerCenter() {
  if (!configured) return;
  await RevenueCatUI.presentCustomerCenter();
}
