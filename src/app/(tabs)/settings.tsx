import { useState } from 'react';
import { Alert, Linking, Share, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { initialState, useStore } from '@/lib/store';
import { Button, C, Card, Chip, H1, H2, P, Row, Screen, Stepper } from '@/components/ui';
import type { AppRule } from '@/lib/logic';
import { CONFIG } from '@/lib/config';
import { restore, usePlus } from '@/lib/purchases';

const REMINDER_ID = 'klarity-daily';

function validRule(r: unknown): r is AppRule {
  const x = r as AppRule;
  return !!x && typeof x.id === 'string' && typeof x.name === 'string' && typeof x.scheme === 'string' && typeof x.baseDelay === 'number';
}

export default function Settings() {
  const { state, update, replace, locked } = useStore();
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const plus = usePlus();
  const [restoring, setRestoring] = useState(false);

  const doRestore = async () => {
    setRestoring(true);
    try {
      const ok = await restore();
      Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Klarity Pro is active.' : 'No Klarity Pro purchase was found for this Apple ID.');
    } catch {
      Alert.alert('Restore failed', 'Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const setReminder = async (on: boolean) => {
    try {
      if (on) {
        const p = await Notifications.requestPermissionsAsync();
        if (!p.granted) return setMsg('Notifications are off for Klarity in iOS Settings.');
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
          identifier: REMINDER_ID,
          content: { title: 'Klarity', body: 'Take a minute to see how today went.' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
        });
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      update((s) => ({ ...s, reminders: on }));
      setMsg('');
    } catch {
      setMsg("Couldn't change the reminder. Try again.");
    }
  };

  const exportBackup = async () => {
    const payload = { klarityBackup: 1, rules: state.rules, goalOpens: state.goalOpens, avgSessionMin: state.avgSessionMin };
    try {
      await Share.share({ message: JSON.stringify(payload) });
    } catch {
      setMsg("Couldn't share the backup.");
    }
  };

  const importBackup = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const j = JSON.parse(text);
      if (j?.klarityBackup !== 1 || !Array.isArray(j.rules) || !j.rules.every(validRule)) throw new Error('bad');
      update((s) => ({
        ...s,
        onboarded: true,
        rules: j.rules,
        goalOpens: typeof j.goalOpens === 'number' ? j.goalOpens : s.goalOpens,
        avgSessionMin: typeof j.avgSessionMin === 'number' ? j.avgSessionMin : s.avgSessionMin,
      }));
      setMsg(`Restored ${j.rules.length} app rules.`);
    } catch {
      setMsg('Copy your backup text first, then tap Restore. That text did not look like a Klarity backup.');
    }
  };

  const lockFor = (h: number) => {
    if (!/^\d{4}$/.test(pin)) return setMsg('Choose a 4-digit PIN first. Ask someone you trust to keep it.');
    update((s) => ({ ...s, lockPin: pin, lockUntil: Date.now() + h * 3_600_000 }));
    setPin('');
    setMsg(`Locked for ${h} hours.`);
  };

  const unlockEarly = () => {
    if (pin === state.lockPin) {
      update((s) => ({ ...s, lockUntil: 0 }));
      setPin('');
      setMsg('Unlocked.');
    } else setMsg('That PIN is not correct.');
  };

  const reset = () =>
    Alert.alert('Erase all Klarity data?', 'This removes your rules, history and streak from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase',
        style: 'destructive',
        onPress: () => {
          replace(initialState());
          router.replace('/onboarding');
        },
      },
    ]);

  const left = Math.max(0, Math.ceil((state.lockUntil - Date.now()) / 60000));

  return (
    <Screen>
      <H1>Settings</H1>

      <H2>Klarity Pro</H2>
      {plus ? (
        <Card style={{ borderColor: C.acc }}>
          <Text testID="settings-pro-active" style={{ color: C.acc, fontWeight: '600', fontSize: 16 }}>Klarity Pro is active</Text>
          <P dim>Manage or cancel a subscription in your Apple ID settings.</P>
        </Card>
      ) : (
        <Button testID="settings-pro" label="See Klarity Pro" onPress={() => router.push('/paywall')} />
      )}
      <View style={{ height: 8 }} />
      <Button testID="settings-restore" label={restoring ? 'Restoring…' : 'Restore purchases'} kind="ghost" disabled={restoring} onPress={doRestore} />
      <Row style={{ marginTop: 10, justifyContent: 'center', gap: 24 }}>
        <Text accessibilityRole="link" style={{ color: C.acc }} onPress={() => Linking.openURL(CONFIG.termsUrl).catch(() => {})}>Terms of Use</Text>
        <Text accessibilityRole="link" style={{ color: C.acc }} onPress={() => Linking.openURL(CONFIG.privacyUrl).catch(() => {})}>Privacy Policy</Text>
      </Row>

      <H2>Goals</H2>
      <Stepper label="Daily opens goal" value={state.goalOpens} min={1} max={100} disabled={locked} onChange={(v) => update((s) => ({ ...s, goalOpens: v }))} />
      <Stepper label="Minutes per open" value={state.avgSessionMin} min={1} max={30} disabled={locked} onChange={(v) => update((s) => ({ ...s, avgSessionMin: v }))} fmt={(v) => `${v} min`} />
      <P dim>Used to estimate time kept. It's a rough guide, not a measurement.</P>

      <H2>Connection</H2>
      <Button label="Shortcuts setup and status" kind="ghost" onPress={() => router.push('/setup')} />

      <H2>Evening check-in</H2>
      <Row>
        <Chip label={state.reminders ? 'On at 8 pm' : 'Off'} on={state.reminders} onPress={() => setReminder(!state.reminders)} />
      </Row>

      <H2>Settings lock</H2>
      <P dim>Lock your rules so you can't loosen them in a weak moment. Give the PIN to someone you trust.</P>
      {locked ? (
        <Card style={{ borderColor: C.warn }}>
          <Text style={{ color: C.warn }}>Locked for about {left} more minutes.</Text>
          <TextInput
            accessibilityLabel="PIN to unlock early"
            placeholder="PIN to unlock early"
            placeholderTextColor={C.mut}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={pin}
            onChangeText={setPin}
            style={{ color: C.fg, borderColor: C.line, borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 10, fontSize: 16 }}
          />
          <Button label="Unlock early" kind="ghost" onPress={unlockEarly} />
        </Card>
      ) : (
        <>
          <TextInput
            accessibilityLabel="Choose a 4 digit PIN"
            placeholder="Choose a 4-digit PIN"
            placeholderTextColor={C.mut}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={pin}
            onChangeText={setPin}
            style={{ color: C.fg, borderColor: C.line, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16 }}
          />
          <Row>
            {[1, 8, 24].map((h) => (
              <Chip key={h} label={`Lock ${h}h`} on={false} onPress={() => lockFor(h)} />
            ))}
          </Row>
        </>
      )}

      <H2>Backup</H2>
      <P dim>Your rules can be saved as text and restored after a reinstall. Send it to yourself in Notes or Messages.</P>
      <View style={{ height: 8 }} />
      <Button label="Back up my rules" kind="ghost" onPress={exportBackup} />
      <View style={{ height: 8 }} />
      <Button label="Restore from copied backup" kind="ghost" disabled={locked} onPress={importBackup} />

      <H2>Privacy</H2>
      <P dim>
        Klarity has no account, no ads and no analytics, and it never sends your data anywhere. Rules and history live only on this iPhone. Klarity can't see what you do inside other apps. Optional Klarity Pro purchases are handled by Apple.
      </P>

      <H2>Data</H2>
      <Button label="Erase all data" kind="danger" disabled={locked} onPress={reset} />

      {!!msg && <P style={{ color: C.warn, marginTop: 14 }}>{msg}</P>}
      <View style={{ height: 10 }} />
      <P dim style={{ fontSize: 13 }}>Klarity 1.0 · Support: samayhuf@gmail.com</P>
    </Screen>
  );
}
