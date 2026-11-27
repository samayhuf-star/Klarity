// RevenueCat purchases. Offering "default" with $rc_weekly / $rc_monthly / $rc_annual / $rc_lifetime,
// entitlement "pro". The free core (3 apps) works without any store connection.
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { INTRO_ELIGIBILITY_STATUS, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { CONFIG, PLAN_ORDER, PRODUCT_IDS, RC_PACKAGE, type PlanKind } from './config';

let configured = false;
let plus = false;
const listeners = new Set<(v: boolean) => void>();

function setPlus(v: boolean) {
  plus = v;
  listeners.forEach((l) => l(v));
}

function fromInfo(info: CustomerInfo): boolean {
  const on = Boolean(info.entitlements.active[CONFIG.entitlementId]);
  setPlus(on);
  return on;
}

export const purchasesReady = () => configured;

export async function initPurchases() {
  if (configured || Platform.OS !== 'ios' || !CONFIG.revenueCatIosKey) return;
  try {
    Purchases.configure({ apiKey: CONFIG.revenueCatIosKey });
    configured = true;
    Purchases.addCustomerInfoUpdateListener(fromInfo);
    fromInfo(await Purchases.getCustomerInfo());
  } catch {
    // Offline or not configured yet: keep the last known state.
  }
}

export function usePlus(): boolean {
  const [v, setV] = useState(plus);
  useEffect(() => {
    listeners.add(setV);
    setV(plus);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}

export type OfferPlan = {
  kind: PlanKind;
  price: string;
  trialDays: number | null;
  pkg: PurchasesPackage;
};

export type Offer = Partial<Record<PlanKind, OfferPlan>>;

const DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

function trialDaysOf(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const per = DAYS[intro.periodUnit] ?? 0;
  const days = per * (intro.periodNumberOfUnits || 0) * (intro.cycles || 1);
  return days > 0 ? days : null;
}

function matches(pkg: PurchasesPackage, kind: PlanKind): boolean {
  const id = pkg.product.identifier;
  return pkg.identifier === RC_PACKAGE[kind] || id === PRODUCT_IDS[kind] || id.startsWith(`${PRODUCT_IDS[kind]}:`);
}

export async function loadOffer(): Promise<Offer> {
  if (!configured) await initPurchases();
  if (!configured) return {};
  let pkgs: PurchasesPackage[] = [];
  try {
    const offerings = await Purchases.getOfferings();
    pkgs = offerings.current?.availablePackages ?? Object.values(offerings.all)[0]?.availablePackages ?? [];
  } catch {
    return {};
  }
  const offer: Offer = {};
  for (const kind of PLAN_ORDER) {
    const pkg = pkgs.find((p) => matches(p, kind));
    if (!pkg) continue;
    offer[kind] = {
      kind,
      pkg,
      price: pkg.product.priceString,
      trialDays: kind === 'lifetime' ? null : trialDaysOf(pkg),
    };
  }
  // Trial copy only for Apple IDs that can still redeem the intro offer.
  const subs = PLAN_ORDER.filter((k) => k !== 'lifetime' && offer[k]?.trialDays);
  if (subs.length) {
    try {
      const ids = subs.map((k) => offer[k]!.pkg.product.identifier);
      const elig = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids);
      for (const k of subs) {
        const status = elig[offer[k]!.pkg.product.identifier]?.status;
        if (status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE) offer[k]!.trialDays = null;
      }
    } catch {
      // Keep the store's trial info.
    }
  }
  return offer;
}

/** Returns true when the purchase unlocked Pro. User cancellation returns false. */
export async function buy(plan: OfferPlan): Promise<boolean> {
  if (!configured) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    return fromInfo(customerInfo);
  } catch (err) {
    if ((err as { userCancelled?: boolean } | null)?.userCancelled) return false;
    throw err;
  }
}

export async function restore(): Promise<boolean> {
  if (!configured) await initPurchases();
  if (!configured) return false;
  return fromInfo(await Purchases.restorePurchases());
}
