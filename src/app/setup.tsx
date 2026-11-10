import { useState } from 'react';
import { router } from 'expo-router';
import { Linking, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '@/lib/store';
import { Button, C, Card, H1, H2, P, Screen } from '@/components/ui';

function ago(t: number | null): string {
  if (!t) return 'never';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
}

export default function Setup() {
  const { state } = useStore();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (id: string) => {
    try {
      await Clipboard.setStringAsync(`klarity://pause/${id}`);
      setCopied(id);
    } catch {
      setCopied(null);
    }
  };
  const working = state.lastExternalPause !== null;

  return (
    <Screen>
      <H1>Connect your apps</H1>
      <P dim>
        iPhone only lets an app interrupt other apps through the Shortcuts app. This takes about 2 minutes per app, once.
      </P>

      <Card style={{ borderColor: working ? C.acc : C.warn, marginTop: 12 }}>
        <Text style={{ color: working ? C.acc : C.warn, fontWeight: '600', fontSize: 16 }}>
          {working ? 'Connected' : 'Not connected yet'}
        </Text>
        <P dim>Last pause received from Shortcuts: {ago(state.lastExternalPause)}.</P>
      </Card>

      <H2>Steps (repeat for each app)</H2>
      <Card>
        <P>1. Open the Shortcuts app and go to the Automation tab.</P>
        <P>2. Tap +, choose App, pick the app, and select "Is Opened".</P>
        <P>3. Choose "Run Immediately" and tap Next.</P>
        <P>4. Add the action "Open URLs" and paste the link for that app (copy it below).</P>
        <P>5. Tap Done. Next time you open that app, Klarity pauses you first.</P>
      </Card>
      <View style={{ height: 6 }} />
      <Button label="Open Shortcuts" kind="ghost" onPress={() => Linking.openURL('shortcuts://').catch(() => {})} />

      <H2>Your links</H2>
      {state.rules.length === 0 && <P dim>Add apps first in the Apps tab.</P>}
      {state.rules.map((r) => (
        <Card key={r.id}>
          <Text style={{ color: C.fg, fontWeight: '600' }}>{r.name}</Text>
          <Text selectable style={{ color: C.mut, marginVertical: 6 }}>klarity://pause/{r.id}</Text>
          <Button label={copied === r.id ? 'Copied' : 'Copy link'} kind="ghost" onPress={() => copy(r.id)} />
        </Card>
      ))}

      <H2>Good to know</H2>
      <P dim>
        You stay in control. You can turn off any automation in Shortcuts at any time. Klarity can't read other apps or see what you do inside them. Everything it knows is the times you chose to open or skip.
      </P>
      <View style={{ height: 16 }} />
      <Button label="Done" onPress={() => router.replace('/')} />
    </Screen>
  );
}
