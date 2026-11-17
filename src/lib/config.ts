// Product IDs follow the iOS bundle id com.samayhuf.klarity (app.json).
// Monthly $2.99 and yearly $19.99 are in the auto-renewable group "Klarity Pro", each with a 7-day free trial.
// Lifetime $39.99 is a non-consumable with no trial. ASC products are not created by this repo.
export const PRODUCT_IDS = {
  monthly: 'com.samayhuf.klarity.monthly',
  yearly: 'com.samayhuf.klarity.yearly',
  lifetime: 'com.samayhuf.klarity.lifetime',
} as const;

// RevenueCat: public SDK keys are set at build time in the EAS environment (appl_ / goog_).
// Entitlement "premium" is unlocked by the monthly, yearly and lifetime products above, all on the "default" offering.
/** Free tier: the full pause flow for up to this many apps. */
export const FREE_APP_LIMIT = 3;

export const CONFIG = {
  appName: 'Klarity',
  entitlementId: 'premium',
  revenueCatIosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '',
  freeAppLimit: 3,
  termsUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacyUrl: 'https://samayhuf-star.github.io/Klarity/privacy.html',
} as const;
