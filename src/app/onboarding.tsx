import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Chip, H1, H2, P, Row, Screen } from '@/components/ui';
import { CATALOG, newRule } from '@/lib/catalog';
import { useStore } from '@/lib/store';

export default function Onboarding() {
  const { update } = useStore();
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const go = () => {
    update((s) => ({
      ...s,
      onboarded: true,
      firstUse: Date.now(),
      rules: CATALOG.filter((a) => picked.includes(a.id)).map(newRule),
    }));
    router.replace('/setup');
  };

  return (
    <Screen>
      <H1>Welcome to Klarity</H1>
      <P dim>
        Klarity adds a calm pause before the apps you open on autopilot. Everything stays on your phone. No account, no ads, no subscription.
      </P>
      <H2>Which apps pull you in?</H2>
      <Row>
        {CATALOG.map((a) => (
          <Chip key={a.id} label={a.name} on={picked.includes(a.id)} onPress={() => toggle(a.id)} />
        ))}
      </Row>
      <View style={{ height: 24 }} />
      <Button label={picked.length ? `Continue with ${picked.length} app${picked.length > 1 ? 's' : ''}` : 'Skip for now'} onPress={go} />
    </Screen>
  );
}
