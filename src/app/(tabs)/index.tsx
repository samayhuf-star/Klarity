import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { useEffect, useMemo } from 'react';
import { syncNotifications } from '@/lib/notify';
import { useStore } from '@/lib/store';
import { Bar, Button, C, Card, F, H1, H2, P, Ring, Row, Screen } from '@/components/ui';
import { computeStreak, decide, fmtDelay, minutesReclaimed, opensToday } from '@/lib/logic';

export default function Today() {
  const { state, ready } = useStore();
  const now = Date.now();
  const total = opensToday(state.events, null, now);
  const streak = useMemo(
    () => computeStreak(state.events, state.goalOpens, state.firstUse, now),
    [state.events, state.goalOpens, state.firstUse, now],
  );
  const skipsToday = state.events.filter((e) => e.kind === 'skip' && new Date(e.t).toDateString() === new Date(now).toDateString()).length;

  useEffect(() => {
    if (ready && state.notifyStreak) void syncNotifications(state).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, total, state.notifyStreak, state.goalOpens]);

  if (!ready) return null;
  if (!state.onboarded) return <Redirect href="/onboarding" />;

  const stale = state.lastExternalPause === null;

  return (
    <Screen>
      <View testID="home-screen" />
      <H1>Today</H1>
      <P dim>Pause first. Then choose.</P>

      <Card style={{ marginTop: 14, alignItems: 'center', paddingVertical: 24 }}>
        <Ring size={190} stroke={14} progress={state.goalOpens > 0 ? total / state.goalOpens : 0} color={total > state.goalOpens ? C.bad : C.acc}>
          <Text accessibilityLabel={`${total} of ${state.goalOpens} opens`} style={{ color: C.fg, fontFamily: F.head, fontSize: 46 }}>
            {total}
          </Text>
          <Text style={{ color: C.mut, fontFamily: F.body }}>of {state.goalOpens} opens</Text>
        </Ring>
        <View style={{ height: 14 }} />
        <P dim style={{ textAlign: 'center' }}>
          {skipsToday} skipped · about {minutesReclaimed(skipsToday, state.avgSessionMin)} min kept today (estimate)
        </P>
      </Card>

      <Card>
        <Text style={{ color: C.fg, fontSize: 17, fontFamily: F.head }}>
          {streak.streak}-day streak
        </Text>
        <P dim>
          A day counts when you stay at or under {state.goalOpens} opens. One slip per week is forgiven, so a bad day doesn't erase your progress.
        </P>
      </Card>

      {stale && (
        <Card style={{ borderColor: C.warn }}>
          <Text style={{ color: C.warn, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>Setup not finished</Text>
          <P dim>Klarity hasn't received a pause from your iPhone yet. Finish the 2-minute Shortcuts setup so it can interrupt automatic opens.</P>
          <View style={{ height: 10 }} />
          <Button label="Finish setup" onPress={() => router.push('/setup')} />
        </Card>
      )}

      <H2>Open mindfully</H2>
      {state.rules.length === 0 && <P dim>No apps yet. Add some in the Apps tab.</P>}
      {state.rules.map((r) => {
        const n = opensToday(state.events, r.id, now);
        const d = decide(r, n, now);
        return (
          <Card key={r.id}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ color: C.fg, fontSize: 17, fontFamily: F.head }}>{r.name}</Text>
              <Text style={{ color: C.mut }}>
                {n}
                {r.dailyOpens > 0 ? ` / ${r.dailyOpens}` : ''} opens
              </Text>
            </Row>
            <P dim>
              {d.blocked ? 'Blocked right now' : `Next wait: ${fmtDelay(d.delay)}`}
              {d.overLimit && !d.blocked ? ' · over your limit' : ''}
            </P>
            <View style={{ height: 10 }} />
            <Button
              label={d.blocked ? `${r.name} is blocked` : `Open ${r.name}`}
              kind={d.blocked ? 'ghost' : 'primary'}
              onPress={() => router.push({ pathname: '/pause/[id]', params: { id: r.id, src: 'app' } })}
            />
          </Card>
        );
      })}
    </Screen>
  );
}
