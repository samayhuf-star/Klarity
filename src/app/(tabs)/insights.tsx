import { Text, View } from 'react-native';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Bar, C, Card, H1, H2, P, Row, Screen } from '@/components/ui';
import { DAY_MS, dayStats, minutesReclaimed } from '@/lib/logic';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Insights() {
  const { state } = useStore();
  const now = Date.now();
  const data = useMemo(() => {
    const days = dayStats(state.events, now, 7);
    const cutoff = now - 7 * DAY_MS;
    const week = state.events.filter((e) => e.t >= cutoff);
    const byApp = new Map<string, number>();
    const byHour = new Array(24).fill(0) as number[];
    for (const e of week) {
      if (e.kind === 'pause') byApp.set(e.app, (byApp.get(e.app) ?? 0) + 1);
      if (e.kind === 'open') byHour[new Date(e.t).getHours()]++;
    }
    const top = [...byApp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const peak = byHour.indexOf(Math.max(...byHour));
    return { days, top, peak: byHour[peak] > 0 ? peak : null, skips: days.reduce((a, d) => a + d.skips, 0), opens: days.reduce((a, d) => a + d.opens, 0) };
  }, [state.events, now]);

  const max = Math.max(1, ...data.days.map((d) => d.opens + d.skips));
  const nameOf = (id: string) => state.rules.find((r) => r.id === id)?.name ?? id;

  return (
    <Screen>
      <H1>Insights</H1>
      <P dim>Last 7 days. Computed on your phone and never uploaded.</P>

      <Row style={{ marginTop: 14 }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: C.acc, fontSize: 26, fontWeight: '700' }}>{data.skips}</Text>
          <P dim>times you chose something else</P>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: C.acc, fontSize: 26, fontWeight: '700' }}>~{minutesReclaimed(data.skips, state.avgSessionMin)}m</Text>
          <P dim>kept (estimate at {state.avgSessionMin} min per open)</P>
        </Card>
      </Row>

      <H2>Opens vs skips</H2>
      {data.days.map((d) => {
        const dow = DOW[new Date(d.key + 'T12:00:00').getDay()];
        return (
          <View key={d.key} style={{ marginBottom: 10 }} accessible accessibilityLabel={`${dow}: ${d.opens} opens, ${d.skips} skipped`}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ color: C.fg }}>{dow}</Text>
              <Text style={{ color: C.mut }}>{d.opens} opened · {d.skips} skipped</Text>
            </Row>
            <View style={{ height: 4 }} />
            <Bar value={d.opens} max={max} color={C.warn} />
            <View style={{ height: 3 }} />
            <Bar value={d.skips} max={max} color={C.acc} />
          </View>
        );
      })}
      <Row>
        <Text style={{ color: C.warn }}>■ opened</Text>
        <Text style={{ color: C.acc }}>■ skipped</Text>
      </Row>

      <H2>Triggers</H2>
      {data.top.length === 0 ? (
        <P dim>No data yet. Use the pause a few times and patterns will appear here.</P>
      ) : (
        data.top.map(([id, n]) => (
          <Card key={id}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ color: C.fg }}>{nameOf(id)}</Text>
              <Text style={{ color: C.mut }}>{n} pauses</Text>
            </Row>
          </Card>
        ))
      )}
      {data.peak !== null && (
        <P dim>You open apps most around {String(data.peak).padStart(2, '0')}:00. That's a good time for a scheduled block.</P>
      )}
    </Screen>
  );
}
