import { useState } from 'react';
import { router } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { useStore } from '@/lib/store';
import { Button, C, Card, Chip, H1, H2, P, Row, Screen } from '@/components/ui';
import { CATALOG, newRule } from '@/lib/catalog';
import { fmtDelay } from '@/lib/logic';

export default function Apps() {
  const { state, update, locked } = useStore();
  const [name, setName] = useState('');
  const [scheme, setScheme] = useState('');
  const have = new Set(state.rules.map((r) => r.id));
  const available = CATALOG.filter((a) => !have.has(a.id));

  const addCustom = () => {
    const n = name.trim();
    let sc = scheme.trim();
    if (!n || !sc) return;
    if (!sc.includes('://')) sc = `${sc}://`;
    const id = `custom-${n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (have.has(id)) return;
    update((s) => ({ ...s, rules: [...s.rules, newRule({ id, name: n, scheme: sc })] }));
    setName('');
    setScheme('');
  };

  return (
    <Screen>
      <H1>Apps</H1>
      <P dim>Each app gets its own wait, limit and schedule.</P>
      {locked && (
        <Card style={{ borderColor: C.warn, marginTop: 10 }}>
          <Text style={{ color: C.warn }}>Settings are locked. Rules can't be changed until the lock ends.</Text>
        </Card>
      )}

      <H2>Your apps</H2>
      {state.rules.length === 0 && <P dim>Nothing here yet.</P>}
      {state.rules.map((r) => (
        <Card key={r.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ color: C.fg, fontSize: 17, fontWeight: '600' }}>{r.name}</Text>
            {r.strict && <Text style={{ color: C.warn }}>Strict</Text>}
          </Row>
          <P dim>
            Wait {fmtDelay(r.baseDelay)} (+{r.growBy}s per open) · {r.dailyOpens > 0 ? `limit ${r.dailyOpens}/day` : 'no limit'}
            {r.window ? ' · scheduled block' : ''}
          </P>
          <View style={{ height: 10 }} />
          <Row>
            <View style={{ flex: 1 }}>
              <Button label="Edit rules" kind="ghost" onPress={() => router.push({ pathname: '/rule/[id]', params: { id: r.id } })} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Remove" kind="ghost" disabled={locked} onPress={() => update((s) => ({ ...s, rules: s.rules.filter((x) => x.id !== r.id) }))} />
            </View>
          </Row>
        </Card>
      ))}

      {available.length > 0 && (
        <>
          <H2>Add an app</H2>
          <Row>
            {available.map((a) => (
              <Chip key={a.id} label={`+ ${a.name}`} on={false} disabled={locked} onPress={() => update((s) => ({ ...s, rules: [...s.rules, newRule(a)] }))} />
            ))}
          </Row>
        </>
      )}

      <H2>Add another app</H2>
      <P dim>Any app with a URL scheme works. Enter its name and scheme (for example "spotify").</P>
      <TextInput
        accessibilityLabel="App name"
        placeholder="App name"
        placeholderTextColor={C.mut}
        value={name}
        onChangeText={setName}
        style={{ color: C.fg, borderColor: C.line, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8, fontSize: 16 }}
      />
      <TextInput
        accessibilityLabel="URL scheme"
        placeholder="URL scheme, e.g. spotify"
        placeholderTextColor={C.mut}
        autoCapitalize="none"
        autoCorrect={false}
        value={scheme}
        onChangeText={setScheme}
        style={{ color: C.fg, borderColor: C.line, borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 8, fontSize: 16 }}
      />
      <Button label="Add app" disabled={locked || !name.trim() || !scheme.trim()} onPress={addCustom} />
    </Screen>
  );
}
