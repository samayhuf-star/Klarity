import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { addEvent, useStore } from '@/lib/store';
import { Button, C, H1, P, Screen } from '@/components/ui';
import { SWAPS, decide, fmtDelay, opensToday, promptFor } from '@/lib/logic';

type Phase = 'init' | 'wait' | 'choice' | 'swap' | 'blocked' | 'grace' | 'missing' | 'done';

export default function Pause() {
  const { id, src } = useLocalSearchParams<{ id: string; src?: string }>();
  const { state, update, ready } = useStore();
  const rule = state.rules.find((r) => r.id === id);
  const [phase, setPhase] = useState<Phase>('init');
  const [left, setLeft] = useState(0);
  const [breathIn, setBreathIn] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const started = useRef(false);
  const scale = useRef(new Animated.Value(0.6)).current;
  const external = src !== 'app';

  // Decide what to show, once, when storage has loaded.
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const now = Date.now();
    if (!rule) return setPhase('missing');

    if (external) update((s) => ({ ...s, lastExternalPause: now }));

    const inGrace = (state.graceUntil[rule.id] ?? 0) > now;
    if (inGrace) {
      const last = state.lastBounce[rule.id] ?? 0;
      if (now - last > 8000) {
        update((s) => ({ ...s, lastBounce: { ...s.lastBounce, [rule.id]: now } }));
        Linking.openURL(rule.scheme).catch(() => setErr(`Couldn't open ${rule.name}. Is it installed?`));
      }
      return setPhase('grace');
    }

    const n = opensToday(state.events, rule.id, now);
    const d = decide(rule, n, now);
    update((s) => addEvent(s, { t: now, app: rule.id, kind: 'pause', ext: external }));
    if (d.blocked) {
      setNote(d.blocked === 'window' ? 'This app is blocked during your scheduled window.' : `You've reached your limit of ${rule.dailyOpens} opens today.`);
      return setPhase('blocked');
    }
    if (d.overLimit) setNote(`You're past your limit of ${rule.dailyOpens} opens today.`);
    else if (d.inBlockWindow) setNote('This is inside your scheduled focus window.');
    setLeft(d.delay);
    setPhase('wait');
  }, [ready, rule, state, external, update]);

  // Countdown.
  useEffect(() => {
    if (phase !== 'wait') return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(t);
          setPhase('choice');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Breathing: 4 s in, 4 s out.
  useEffect(() => {
    if (phase !== 'wait') return;
    let alive = true;
    let inhale = true;
    const run = () => {
      if (!alive) return;
      setBreathIn(inhale);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Animated.timing(scale, { toValue: inhale ? 1 : 0.6, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(() => {
        inhale = !inhale;
        run();
      });
    };
    run();
    return () => {
      alive = false;
      scale.stopAnimation();
    };
  }, [phase, scale]);

  if (!rule) {
    return (
      <Screen>
        <H1>Unknown app</H1>
        <P dim>This app isn't in your Klarity list.</P>
        <View style={{ height: 16 }} />
        <Button label="Back to Klarity" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const openApp = () => {
    const now = Date.now();
    update((s) => ({
      ...addEvent(s, { t: now, app: rule.id, kind: 'open' }),
      graceUntil: { ...s.graceUntil, [rule.id]: now + rule.graceMin * 60_000 },
    }));
    Linking.openURL(rule.scheme).catch(() => setErr(`Couldn't open ${rule.name}. Is it installed?`));
  };

  const skip = (swap?: string) => {
    update((s) => addEvent(s, { t: Date.now(), app: rule.id, kind: 'skip', swap }));
    setPhase('done');
  };

  const prompt = promptFor(rule.id, opensToday(state.events, rule.id, Date.now()));

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {phase === 'init' && <P dim style={{ textAlign: 'center' }}>One moment…</P>}

        {phase === 'wait' && (
          <>
            <Text accessibilityRole="header" style={{ color: C.fg, fontSize: 24, textAlign: 'center', fontWeight: '600' }}>{prompt}</Text>
            {!!note && <P style={{ color: C.warn, textAlign: 'center', marginTop: 10 }}>{note}</P>}
            <View style={{ alignItems: 'center', marginVertical: 36 }}>
              <Animated.View
                accessibilityLabel={`${breathIn ? 'Breathe in' : 'Breathe out'}. ${left} seconds left`}
                style={{ width: 180, height: 180, borderRadius: 90, backgroundColor: C.accDim, borderColor: C.acc, borderWidth: 2, alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}
              >
                <Text style={{ color: C.fg, fontSize: 40, fontWeight: '700' }}>{left}</Text>
              </Animated.View>
              <P dim style={{ marginTop: 14 }}>{breathIn ? 'Breathe in…' : 'Breathe out…'}</P>
            </View>
            <Button label="Not now" kind="ghost" onPress={() => setPhase('swap')} />
          </>
        )}

        {phase === 'choice' && (
          <>
            <Text accessibilityRole="header" style={{ color: C.fg, fontSize: 24, textAlign: 'center', fontWeight: '600' }}>
              Still want {rule.name}?
            </Text>
            {!!note && <P style={{ color: C.warn, textAlign: 'center', marginTop: 10 }}>{note}</P>}
            <P dim style={{ textAlign: 'center', marginVertical: 18 }}>
              You'll have {rule.graceMin} min before Klarity asks again.
            </P>
            <Button label="Do something else" onPress={() => setPhase('swap')} />
            <View style={{ height: 10 }} />
            <Button label={`Open ${rule.name}`} kind="ghost" onPress={openApp} />
          </>
        )}

        {phase === 'swap' && (
          <>
            <Text accessibilityRole="header" style={{ color: C.fg, fontSize: 22, textAlign: 'center', fontWeight: '600', marginBottom: 16 }}>
              Try one of these instead
            </Text>
            {SWAPS.map((sw) => (
              <View key={sw} style={{ marginBottom: 8 }}>
                <Button label={sw} kind="ghost" onPress={() => skip(sw)} />
              </View>
            ))}
            <View style={{ height: 6 }} />
            <Button label="Just close this" onPress={() => skip()} />
          </>
        )}

        {phase === 'blocked' && (
          <>
            <Text accessibilityRole="header" style={{ color: C.fg, fontSize: 24, textAlign: 'center', fontWeight: '600' }}>
              {rule.name} is blocked
            </Text>
            <P dim style={{ textAlign: 'center', marginVertical: 16 }}>{note}</P>
            <Button label="Do something else" onPress={() => setPhase('swap')} />
            <View style={{ height: 10 }} />
            <Button label="Back to Klarity" kind="ghost" onPress={() => router.replace('/')} />
          </>
        )}

        {phase === 'grace' && (
          <>
            <Text accessibilityRole="header" style={{ color: C.fg, fontSize: 22, textAlign: 'center', fontWeight: '600' }}>
              You're in your {rule.graceMin}-minute window
            </Text>
            <P dim style={{ textAlign: 'center', marginVertical: 16 }}>No pause needed right now.</P>
            <Button label={`Return to ${rule.name}`} onPress={() => Linking.openURL(rule.scheme).catch(() => setErr(`Couldn't open ${rule.name}.`))} />
            <View style={{ height: 10 }} />
            <Button label="Back to Klarity" kind="ghost" onPress={() => router.replace('/')} />
          </>
        )}

        {phase === 'done' && (
          <>
            <Text accessibilityRole="header" style={{ color: C.fg, fontSize: 26, textAlign: 'center', fontWeight: '700' }}>Nice. That's a win. 🌿</Text>
            <P dim style={{ textAlign: 'center', marginVertical: 16 }}>You can lock your phone or go back to what you were doing.</P>
            <Button label="Back to Klarity" onPress={() => router.replace('/')} />
          </>
        )}

        {phase === 'missing' && (
          <>
            <H1>Unknown app</H1>
            <Button label="Back to Klarity" onPress={() => router.replace('/')} />
          </>
        )}

        {!!err && <P style={{ color: C.bad, textAlign: 'center', marginTop: 14 }}>{err}</P>}
        {phase === 'wait' && <P dim style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>Wait: {fmtDelay(left)}</P>}
      </View>
    </Screen>
  );
}
