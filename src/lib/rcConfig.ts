// RevenueCat. Public SDK keys are safe to ship; set them as EAS env vars (EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY).
// Products, offerings and the paywall design live in the RevenueCat dashboard; the app only needs the entitlement id.
export const ENTITLEMENT_ID = 'pro';
export const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';
export const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';
