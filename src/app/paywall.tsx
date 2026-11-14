import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, C, Card, H1, P, Screen } from '@/components/ui';
import { CONFIG, FALLBACK_PRICE, PRODUCT_IDS, TRIAL_DAYS, type PlanKind } from '@/lib/config';
import { buy, loadOffer, restore, usePlus, type Offer } from '@/lib/purchases';

const PLANS: PlanKind[] = ['yearly', 'monthly', 'lifetime'];
const TITLE: Record<PlanKind, string> = { monthly: 'Monthly', yearly: 'Yearly', lifetime: 'Lifetime' };

/** Price line for a plan card. Trial copy shows unless the App Store says this Apple ID has no trial left. */
function planLine(kind: PlanKind, offer: Offer, loaded: boolean): string {
  const plan = offer[kind];
  const price = plan?.price ?? FALLBACK_PRICE[kind];
  if (kind === 'lifetime') return `${price} one-time purchase. Yours forever, no trial, no renewal.`;
  const per = kind === 'yearly' ? 'year' : 'month';
  const trial = plan ? plan.trialDays : loaded ? null : TRIAL_DAYS;
  return trial ? `${trial} days free, then ${price}/${per}, cancel anytime` : `${price}/${per}, cancel anytime`;
}

export default function Paywall() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const insets = useSafeAreaInsets();
  const plus = usePlus();
  const [offer, setOffer] = useState<Offer>({});
  const [loaded, setLoaded] = useState(false);
  const [pick, setPick] = useState<PlanKind>('yearly');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadOffer()
      .then((o) => alive && setOffer(o))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const close = () => {
    if (from === 'onboarding') router.replace('/setup');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  useEffect(() => {
    if (plus) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plus]);

  const purchase = async () => {
    const plan = offer[pick];
    if (!plan) {
      Alert.alert('App Store unavailable', "Prices couldn't be loaded. Check your connection and try again.");
      return;
    }
    setBusy(true);
    try {
      await buy(PRODUCT_IDS[pick]);
    } catch {
      Alert.alert('Purchase not completed', 'Nothing was charged. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      const ok = await restore();
      Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Klarity Pro is active.' : 'No Klarity Pro purchase was found for this Apple ID.');
    } catch {
      Alert.alert('Restore failed', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const sel = offer[pick];
  const cta = pick === 'lifetime' ? 'Unlock Pro forever' : sel?.trialDays || (!loaded && !sel) ? `Start ${TRIAL_DAYS}-day free trial` : 'Subscribe';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} testID="paywall-screen">
      <Pressable
        testID="paywall-close"
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={close}
        hitSlop={12}
        style={{ position: 'absolute', top: insets.top + 8, right: 16, zIndex: 2, width: 40, height: 40, borderRadius: 20, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: C.fg, fontSize: 20 }}>✕</Text>
      </Pressable>
      <Screen>
        <H1>Klarity Pro</H1>
        <P dim>The pause stays free for up to 3 apps. Pro adds more room to build calmer habits.</P>
        <Card style={{ marginTop: 14 }}>
          <P>• Pause as many apps as you like, plus any app by URL scheme</P>
          <P>• Scheduled focus blocks and Strict mode</P>
          <P>• 30-day insights history</P>
        </Card>

        {PLANS.map((k) => (
          <Pressable
            key={k}
            testID={`paywall-plan-${k}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: pick === k }}
            accessibilityLabel={`${TITLE[k]}. ${planLine(k, offer, loaded)}`}
            onPress={() => setPick(k)}
            style={{ backgroundColor: C.card, borderWidth: 2, borderColor: pick === k ? C.acc : C.line, borderRadius: 14, padding: 14, marginBottom: 10 }}
          >
            <Text style={{ color: C.fg, fontSize: 17, fontWeight: '600' }}>{TITLE[k]}</Text>
            <Text style={{ color: C.mut, fontSize: 15, marginTop: 4 }}>{planLine(k, offer, loaded)}</Text>
          </Pressable>
        ))}

        {busy ? <ActivityIndicator color={C.acc} style={{ marginVertical: 14 }} /> : <Button testID="paywall-buy" label={cta} onPress={purchase} />}
        <View style={{ height: 8 }} />
        <Button testID="paywall-restore" label="Restore purchases" kind="ghost" disabled={busy} onPress={doRestore} />

        <P dim style={{ fontSize: 12, lineHeight: 17, marginTop: 14 }}>
          Payment is charged to your Apple ID when you confirm, or when the free trial ends. Subscriptions renew automatically at the same price unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your Apple ID settings. Lifetime is a single payment.
        </P>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 10 }}>
          <Text testID="paywall-terms" accessibilityRole="link" style={{ color: C.acc, fontSize: 13 }} onPress={() => Linking.openURL(CONFIG.termsUrl).catch(() => {})}>
            Terms of Use
          </Text>
          <Text testID="paywall-privacy" accessibilityRole="link" style={{ color: C.acc, fontSize: 13 }} onPress={() => Linking.openURL(CONFIG.privacyUrl).catch(() => {})}>
            Privacy Policy
          </Text>
        </View>
      </Screen>
    </View>
  );
}
