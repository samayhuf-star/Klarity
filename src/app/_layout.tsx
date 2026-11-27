import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '@/lib/store';
import { C } from '@/components/ui';
import { initPurchases } from '@/lib/purchases';
import { applyPushConsent } from '@/lib/push';

/** Starts OneSignal in consent-required mode once the saved choice is loaded. */
function PushGate() {
  const { state, ready } = useStore();
  useEffect(() => {
    if (ready) applyPushConsent(state.pushTips);
  }, [ready, state.pushTips]);
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    void initPurchases();
  }, []);
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <PushGate />
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="pause/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
