// Product IDs follow the iOS bundle id com.samayhuf.klarity (app.json).
// Standard plans: weekly $2.99, monthly $5.99, yearly $29.99 (auto-renewable group "Klarity Pro",
// 7-day free trial on subscriptions) and lifetime $39.99 (non-consumable, no trial).
// Purchases go through RevenueCat (offering "default", packages $rc_weekly/$rc_monthly/$rc_annual/$rc_lifetime,
// entitlement "pro"). ASC and RevenueCat products are not created by this repo.
export const PRODUCT_IDS = {
  weekly: 'com.samayhuf.klarity.weekly',
  monthly: 'com.samayhuf.klarity.monthly',
  yearly: 'com.samayhuf.klarity.yearly',
  lifetime: 'com.samayhuf.klarity.lifetime',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];
export type PlanKind = keyof typeof PRODUCT_IDS;

export const PLAN_ORDER: PlanKind[] = ['yearly', 'monthly', 'weekly', 'lifetime'];

/** RevenueCat package identifier per plan. */
export const RC_PACKAGE: Record<PlanKind, string> = {
  weekly: '$rc_weekly',
  monthly: '$rc_monthly',
  yearly: '$rc_annual',
  lifetime: '$rc_lifetime',
};

/** US list prices, shown only until the App Store returns localized prices. */
export const FALLBACK_PRICE: Record<PlanKind, string> = {
  weekly: '$2.99',
  monthly: '$5.99',
  yearly: '$29.99',
  lifetime: '$39.99',
};
export const TRIAL_DAYS = 7;

/** Free tier: the full pause flow for up to this many apps. */
export const FREE_APP_LIMIT = 3;

export const CONFIG = {
  appName: 'Klarity',
  entitlementId: 'pro',
  // Public client keys, injected at build time from EAS env (production). Never hard-code them here.
  revenueCatIosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '',
  termsUrl: 'https://samayhuf-star.github.io/Klarity/terms.html',
  privacyUrl: 'https://samayhuf-star.github.io/Klarity/privacy.html',
} as const;
