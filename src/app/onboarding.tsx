import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, C, F, H1, P, Ring, Screen } from '@/components/ui';
import { CATALOG, newRule } from '@/lib/catalog';
import { useStore } from '@/lib/store';
import { FREE_APP_LIMIT } from '@/lib/config';
import { usePlus } from '@/lib/purchases';

const GET = [
  ['A calm pause', 'A short breathing moment before the apps you open on autopilot.'],
  ['Your own limits', 'Daily opens, wait times and focus windows for each app.'],
  ['Private by design', 'Everything stays on your phone. No account, no tracking.'],
];

function Dots({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? C.acc : C.line }} />
      ))}
    </View>
  );
}

export default function Onboarding() {
  const { update } = useStore();
  const plus = usePlus();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const atLimit = !plus && picked.length >= FREE_APP_LIMIT;
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : !plus && p.length >= FREE_APP_LIMIT ? p : [...p, id]));

  const finish = () => {
    update((s) => ({
      ...s,
      onboarded: true,
      firstUse: Date.now(),
      rules: CATALOG.filter((a) => picked.includes(a.id)).map(newRule),
    }));
    router.replace({ pathname: '/paywall', params: { from: 'onboarding' } });
  };

  return (
    <Screen>
      <Dots step={step} />
      {step === 0 && (
        <View testID="onboarding-welcome">
          <View style={{ alignItems: 'center', marginVertical: 28 }}>
            <Ring size={220} stroke={16} progress={0.72}>
              <Text style={{ color: C.fg, fontFamily: F.head, fontSize: 44 }}>5s</Text>
              <Text style={{ color: C.mut, fontFamily: F.body }}>to choose</Text>
            </Ring>
          </View>
          <H1>Pause first. Then choose.</H1>
          <P dim>Klarity adds a calm moment before the apps you open without thinking, so your time stays yours.</P>
          <View style={{ height: 28 }} />
          <Button testID="onboarding-next" label="Get started" onPress={() => setStep(1)} />
        </View>
      )}
      {step === 1 && (
        <View>
          <H1>Which apps pull you in?</H1>
          <P dim>Pick up to {plus ? 'as many as you like' : FREE_APP_LIMIT}. You can change this any time.</P>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            {CATALOG.map((a) => {
              const on = picked.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={a.name}
                  onPress={() => toggle(a.id)}
                  style={{ width: '48%', paddingVertical: 18, borderRadius: 20, borderWidth: 1.5, borderColor: on ? C.acc : C.line, backgroundColor: on ? C.accDim : C.card, alignItems: 'center' }}
                >
                  <Text style={{ color: C.fg, fontFamily: F.bodyBold, fontSize: 16 }}>{a.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {atLimit && <P dim style={{ marginTop: 12 }}>The free plan covers {FREE_APP_LIMIT} apps. Klarity Pro adds as many as you like.</P>}
          <View style={{ height: 24 }} />
          <Button testID="onboarding-continue" label={picked.length ? `Continue with ${picked.length}` : 'Skip for now'} onPress={() => setStep(2)} />
        </View>
      )}
      {step === 2 && (
        <View>
          <H1>What you get</H1>
          <View style={{ height: 12 }} />
          {GET.map(([t, d]) => (
            <View key={t} style={{ flexDirection: 'row', gap: 14, marginBottom: 18 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.acc, marginTop: 7 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.fg, fontFamily: F.head, fontSize: 18 }}>{t}</Text>
                <P dim>{d}</P>
              </View>
            </View>
          ))}
          <View style={{ height: 12 }} />
          <Button testID="onboarding-finish" label="Continue" onPress={finish} />
        </View>
      )}
    </Screen>
  );
}
