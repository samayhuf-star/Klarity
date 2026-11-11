import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '@/lib/store';
import { initRevenueCat } from '@/lib/revenuecat';
import { ENTITLEMENT_ID, RC_API_KEY_ANDROID, RC_API_KEY_IOS } from '@/lib/rcConfig';
import { C } from '@/components/ui';

export default function RootLayout() {
  useEffect(() => {
    initRevenueCat({ entitlementId: ENTITLEMENT_ID, iosKey: RC_API_KEY_IOS, androidKey: RC_API_KEY_ANDROID });
  }, []);
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="pause/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
