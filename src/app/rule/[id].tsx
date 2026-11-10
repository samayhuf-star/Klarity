import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { Button, C, Card, Chip, H1, H2, P, Row, Screen, Stepper } from '@/components/ui';
import { fmtDelay, type AppRule, type Window } from '@/lib/logic';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hr = (h: number) => `${String(h).padStart(2, '0')}:00`;

export default function RuleEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update, locked } = useStore();
  const rule = state.rules.find((r) => r.id === id);
  if (!rule) {
    return (
      <Screen>
        <H1>Not found</H1>
        <Button label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }
  const set = (patch: Partial<AppRule>) => update((s) => ({ ...s, rules: s.rules.map((r) => (r.id === rule.id ? { ...r, ...patch } : r)) }));
  const win: Window = rule.window ?? { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 };
  const setWin = (patch: Partial<Window>) => set({ window: { ...win, ...patch } });

  return (
    <Screen>
      <H1>{rule.name}</H1>
      {locked && (
        <Card style={{ borderColor: C.warn }}>
          <Text style={{ color: C.warn }}>Locked. You can look, but not change.</Text>
        </Card>
      )}

      <H2>The pause</H2>
      <Stepper label="Wait before opening" value={rule.baseDelay} min={3} max={60} step={1} fmt={fmtDelay} disabled={locked} onChange={(v) => set({ baseDelay: v })} />
      <Stepper label="Add per open today" value={rule.growBy} min={0} max={15} step={1} fmt={(v) => `+${v}s`} disabled={locked} onChange={(v) => set({ growBy: v })} />
      <P dim>The wait grows each time you open the app in a day, up to 2 minutes.</P>

      <H2>Daily limit</H2>
      <Stepper label="Opens per day" value={rule.dailyOpens} min={0} max={50} fmt={(v) => (v === 0 ? 'None' : String(v))} disabled={locked} onChange={(v) => set({ dailyOpens: v })} />
      <P dim>Past the limit the wait doubles. Turn on Strict to block instead.</P>

      <H2>Grace window</H2>
      <Row>
        {[1, 5, 10, 15].map((m) => (
          <Chip key={m} label={`${m} min`} on={rule.graceMin === m} disabled={locked} onPress={() => set({ graceMin: m })} />
        ))}
      </Row>
      <P dim>After you choose to open, Klarity won't interrupt again (including links opened from other apps) for this long.</P>

      <H2>Scheduled block</H2>
      <Row>
        <Chip label={rule.window ? 'On' : 'Off'} on={!!rule.window} disabled={locked} onPress={() => set({ window: rule.window ? null : win })} />
      </Row>
      {rule.window && (
        <View style={{ marginTop: 8 }}>
          <Row>
            {DAYS.map((d, i) => (
              <Chip
                key={d}
                label={d}
                on={win.days.includes(i)}
                disabled={locked}
                onPress={() => setWin({ days: win.days.includes(i) ? win.days.filter((x) => x !== i) : [...win.days, i] })}
              />
            ))}
          </Row>
          <Stepper label="From" value={win.startHour} min={0} max={23} fmt={hr} disabled={locked} onChange={(v) => setWin({ startHour: v })} />
          <Stepper label="Until" value={win.endHour} min={0} max={23} fmt={hr} disabled={locked} onChange={(v) => setWin({ endHour: v })} />
          <P dim>If "Until" is earlier than "From" the block runs overnight.</P>
        </View>
      )}

      <H2>Strict mode</H2>
      <Row>
        <Chip label={rule.strict ? 'Strict: on' : 'Strict: off'} on={rule.strict} disabled={locked} onPress={() => set({ strict: !rule.strict })} />
      </Row>
      <P dim>Strict blocks the app inside the scheduled window and after the daily limit. Klarity only works while your Shortcuts automation is on, and you can always switch it off in Shortcuts.</P>

      <View style={{ height: 20 }} />
      <Button label="Done" onPress={() => router.back()} />
    </Screen>
  );
}
