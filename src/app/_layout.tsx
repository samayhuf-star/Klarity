import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '@/lib/store';
import { C } from '@/components/ui';
import { useFonts, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { initPurchases } from '@/lib/purchases';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ SpaceGrotesk_500Medium, SpaceGrotesk_700Bold, Inter_400Regular, Inter_600SemiBold });
  useEffect(() => {
    void initPurchases();
  }, []);
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
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
