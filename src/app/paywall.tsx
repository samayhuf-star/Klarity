import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';
import { Button, C, H1, P } from '@/components/ui';
import { purchasesReady, usePlus } from '@/lib/purchases';

/** Paywall is RevenueCat's hosted paywall (designed in the RevenueCat dashboard, attached to the "default" offering). */
export default function Paywall() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const insets = useSafeAreaInsets();
  const plus = usePlus();

  const close = () => {
    if (from === 'onboarding') router.replace('/setup');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  useEffect(() => {
    if (plus) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plus]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} testID="paywall-screen">
      {purchasesReady() ? (
        <RevenueCatUI.Paywall
          style={{ flex: 1 }}
          options={{ displayCloseButton: true }}
          onDismiss={close}
          onPurchaseCompleted={close}
          onRestoreCompleted={close}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
          <Pressable
            testID="paywall-close"
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
            hitSlop={12}
            style={{ position: 'absolute', top: insets.top + 8, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: C.fg, fontSize: 20 }}>✕</Text>
          </Pressable>
          <H1>Klarity Pro</H1>
          <P dim>Plans could not be loaded. Check your connection and try again. The free pause for up to 3 apps keeps working.</P>
          <Button label="Not now" kind="ghost" onPress={close} />
        </View>
      )}
    </View>
  );
}
