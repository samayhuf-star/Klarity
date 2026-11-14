// Product IDs follow the iOS bundle id com.samayhuf.klarity (app.json).
// Monthly $2.99 and yearly $19.99 are in the auto-renewable group "Klarity Pro", each with a 7-day free trial.
// Lifetime $39.99 is a non-consumable with no trial. ASC products are not created by this repo.
export const PRODUCT_IDS = {
  monthly: 'com.samayhuf.klarity.monthly',
  yearly: 'com.samayhuf.klarity.yearly',
  lifetime: 'com.samayhuf.klarity.lifetime',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];
export type PlanKind = 'monthly' | 'yearly' | 'lifetime';

export const SUBSCRIPTION_IDS: ProductId[] = [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly];
export const ALL_PRODUCT_IDS: ProductId[] = [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly, PRODUCT_IDS.lifetime];

export const PLAN_KIND: Record<ProductId, PlanKind> = {
  [PRODUCT_IDS.monthly]: 'monthly',
  [PRODUCT_IDS.yearly]: 'yearly',
  [PRODUCT_IDS.lifetime]: 'lifetime',
};

/** US list prices, shown only until the App Store returns localized prices. */
export const FALLBACK_PRICE: Record<PlanKind, string> = {
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
