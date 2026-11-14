import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Chip, H1, H2, P, Row, Screen } from '@/components/ui';
import { CATALOG, newRule } from '@/lib/catalog';
import { useStore } from '@/lib/store';
import { FREE_APP_LIMIT } from '@/lib/config';
import { usePlus } from '@/lib/purchases';

export default function Onboarding() {
  const { update } = useStore();
  const plus = usePlus();
  const [picked, setPicked] = useState<string[]>([]);
  const atLimit = !plus && picked.length >= FREE_APP_LIMIT;
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : !plus && p.length >= FREE_APP_LIMIT ? p : [...p, id]));

  const go = () => {
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
      <H1>Welcome to Klarity</H1>
      <P dim>
        Klarity adds a calm pause before the apps you open on autopilot. Everything stays on your phone, and there is no account to create.
      </P>
      <H2>Which apps pull you in?</H2>
      <Row>
        {CATALOG.map((a) => (
          <Chip key={a.id} label={a.name} on={picked.includes(a.id)} onPress={() => toggle(a.id)} />
        ))}
      </Row>
      {atLimit && <P dim>The free plan covers {FREE_APP_LIMIT} apps. Klarity Pro adds as many as you like.</P>}
      <View style={{ height: 24 }} />
      <Button testID="onboarding-continue" label={picked.length ? `Continue with ${picked.length} app${picked.length > 1 ? 's' : ''}` : 'Skip for now'} onPress={go} />
    </Screen>
  );
}
