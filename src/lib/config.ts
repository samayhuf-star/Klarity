// Product IDs follow the iOS bundle id com.samayhuf.klarity (app.json).
// Offered plan (17 Nov 2026): weekly $1.99 in the auto-renewable group "Klarity Pro" with a 7-day free trial.
// monthly / yearly / lifetime are retired from the paywall but stay recognised so existing buyers keep Pro.
// ASC products are not created by this repo.
export const PRODUCT_IDS = {
  weekly: 'com.samayhuf.klarity.weekly',
  monthly: 'com.samayhuf.klarity.monthly',
  yearly: 'com.samayhuf.klarity.yearly',
  lifetime: 'com.samayhuf.klarity.lifetime',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];
export type PlanKind = 'weekly' | 'monthly' | 'yearly' | 'lifetime';

/** The only plan shown on the paywall. */
export const OFFERED_PLANS: PlanKind[] = ['weekly'];

export const SUBSCRIPTION_IDS: ProductId[] = [PRODUCT_IDS.weekly, PRODUCT_IDS.monthly, PRODUCT_IDS.yearly];
export const ALL_PRODUCT_IDS: ProductId[] = [PRODUCT_IDS.weekly, PRODUCT_IDS.monthly, PRODUCT_IDS.yearly, PRODUCT_IDS.lifetime];

export const PLAN_KIND: Record<ProductId, PlanKind> = {
  [PRODUCT_IDS.weekly]: 'weekly',
  [PRODUCT_IDS.monthly]: 'monthly',
  [PRODUCT_IDS.yearly]: 'yearly',
  [PRODUCT_IDS.lifetime]: 'lifetime',
};

/** US list prices, shown only until the App Store returns localized prices. */
export const FALLBACK_PRICE: Record<PlanKind, string> = {
  weekly: '$1.99',
  monthly: '$2.99',
  yearly: '$19.99',
  lifetime: '$39.99',
};
export const TRIAL_DAYS = 7;

/** Free tier: the full pause flow for up to this many apps. */
export const FREE_APP_LIMIT = 3;

export const CONFIG = {
  appName: 'Klarity',
  termsUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacyUrl: 'https://samayhuf-star.github.io/Klarity/privacy.html',
} as const;
