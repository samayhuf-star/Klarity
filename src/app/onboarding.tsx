import { useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, C, Card, Chip, H1, P, Row, Screen, Stepper } from '@/components/ui';
import { CATALOG, newRule } from '@/lib/catalog';
import { useStore } from '@/lib/store';
import { FREE_APP_LIMIT } from '@/lib/config';
import { usePlus } from '@/lib/purchases';
import { applyPushConsent } from '@/lib/push';

/** Number of onboarding screens before the paywall (read by the autopilot panel). */
export const ONBOARDING_SCREENS = 10;

const PAUSES = [5, 10, 20, 30];
const WHY = ['Scroll less', 'Sleep better', 'Focus at work', 'Be present with people', 'Just be more intentional'];

export default function Onboarding() {
  const { state, update } = useStore();
  const plus = usePlus();
  const [step, setStep] = useState(0);
  const [why, setWhy] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [goal, setGoal] = useState(state.goalOpens || 15);
  const [pause, setPause] = useState(10);
  const [tips, setTips] = useState(false);

  const atLimit = !plus && picked.length >= FREE_APP_LIMIT;
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : !plus && p.length >= FREE_APP_LIMIT ? p : [...p, id]));
  const toggleWhy = (w: string) => setWhy((p) => (p.includes(w) ? p.filter((x) => x !== w) : [...p, w]));

  const finish = () => {
    update((s) => ({
      ...s,
      onboarded: true,
      firstUse: Date.now(),
      goalOpens: goal,
      pushTips: tips,
      rules: CATALOG.filter((a) => picked.includes(a.id)).map((a) => ({ ...newRule(a), baseDelay: pause })),
    }));
    applyPushConsent(tips);
    router.replace({ pathname: '/paywall', params: { from: 'onboarding' } });
  };

  const next = () => (step < ONBOARDING_SCREENS - 1 ? setStep(step + 1) : finish());
  const back = () => setStep(Math.max(0, step - 1));

  const screens: { body: ReactNode; cta?: string }[] = [
    {
      cta: 'Get started',
      body: (
        <>
          <H1>Welcome to Klarity</H1>
          <P dim>A calm pause before the apps you open on autopilot. No account, no tracking. Everything stays on your iPhone.</P>
        </>
      ),
    },
    {
      body: (
        <>
          <H1>Most opens aren't choices</H1>
          <P dim>We unlock our phones dozens of times a day, and most of those opens happen before we decide anything. Klarity puts the decision back in your hands.</P>
        </>
      ),
    },
    {
      body: (
        <>
          <H1>How the pause works</H1>
          <Card>
            <P>1. You open a distracting app.</P>
            <P>2. Klarity shows a short breathing pause first.</P>
            <P>3. You choose: go in on purpose, or close it.</P>
            <P>4. Each extra open today makes the pause a little longer.</P>
          </Card>
        </>
      ),
    },
    {
      body: (
        <>
          <H1>What do you want more of?</H1>
          <P dim>Pick any that fit. This stays on your phone.</P>
          <Row>
            {WHY.map((w) => (
              <Chip key={w} label={w} on={why.includes(w)} onPress={() => toggleWhy(w)} />
            ))}
          </Row>
        </>
      ),
    },
    {
      cta: picked.length ? `Continue with ${picked.length} app${picked.length > 1 ? 's' : ''}` : 'Skip for now',
      body: (
        <>
          <H1>Which apps pull you in?</H1>
          <Row>
            {CATALOG.map((a) => (
              <Chip key={a.id} label={a.name} on={picked.includes(a.id)} onPress={() => toggle(a.id)} />
            ))}
          </Row>
          {atLimit && <P dim>The free plan covers {FREE_APP_LIMIT} apps. Klarity Pro adds as many as you like.</P>}
        </>
      ),
    },
    {
      body: (
        <>
          <H1>Set a daily goal</H1>
          <P dim>How many opens of these apps feels right for a day? You can change it any time.</P>
          <Stepper label="Opens per day" value={goal} min={3} max={60} onChange={setGoal} />
        </>
      ),
    },
    {
      body: (
        <>
          <H1>How long should the pause be?</H1>
          <P dim>A few seconds is enough to break the reflex. It grows with each extra open.</P>
          <Row>
            {PAUSES.map((p) => (
              <Chip key={p} label={`${p} sec`} on={pause === p} onPress={() => setPause(p)} />
            ))}
          </Row>
        </>
      ),
    },
    {
      body: (
        <>
          <H1>Connected through Shortcuts</H1>
          <P dim>iPhone lets Klarity step in through a Shortcuts automation, set up once per app in about 2 minutes. We'll walk you through it right after this.</P>
        </>
      ),
    },
    {
      body: (
        <>
          <H1>Private by design</H1>
          <Card>
            <P>• Klarity can't read other apps or see what you do inside them.</P>
            <P>• It only knows when you chose to open or skip.</P>
            <P>• No account. Your data never leaves your iPhone.</P>
          </Card>
        </>
      ),
    },
    {
      cta: 'Continue',
      body: (
        <>
          <H1>Tips and updates</H1>
          <P dim>Get an occasional tip for building calmer phone habits and news about new features. Optional, off unless you turn it on. You can change this in Settings.</P>
          <Row>
            <Chip testID="onboarding-tips-on" label="Yes, send tips" on={tips} onPress={() => setTips(true)} />
            <Chip testID="onboarding-tips-off" label="No thanks" on={!tips} onPress={() => setTips(false)} />
          </Row>
        </>
      ),
    },
  ];

  const cur = screens[step];
  return (
    <Screen>
      <Text accessibilityLabel={`Step ${step + 1} of ${ONBOARDING_SCREENS}`} style={{ color: C.mut, fontSize: 13, marginBottom: 8 }}>
        {step + 1} / {ONBOARDING_SCREENS}
      </Text>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 18 }}>
        {screens.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? C.acc : C.line }} />
        ))}
      </View>
      {cur.body}
      <View style={{ height: 24 }} />
      <Button testID="onboarding-continue" label={cur.cta ?? 'Next'} onPress={next} />
      {step > 0 && (
        <>
          <View style={{ height: 8 }} />
          <Button testID="onboarding-back" label="Back" kind="ghost" onPress={back} />
        </>
      )}
    </Screen>
  );
}
