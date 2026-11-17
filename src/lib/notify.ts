import * as Notifications from 'expo-notifications';
import { opensToday, streakSaverDue } from './logic';
import type { State } from './store';

const T = Notifications.SchedulableTriggerInputTypes;

export async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const p = await Notifications.requestPermissionsAsync();
  return p.granted;
}

// Rebuilds every scheduled notification from the current settings. Safe to call often.
export async function syncNotifications(s: State, now = Date.now()): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (s.reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'klarity-daily',
      content: { title: 'Klarity', body: 'Take a minute to see how today went.' },
      trigger: { type: T.DAILY, hour: 20, minute: 0 },
    });
  }
  if (s.notifyWeekly) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'klarity-weekly',
      content: { title: 'Your weekly Klarity report', body: 'See how many times you chose something else this week.' },
      trigger: { type: T.WEEKLY, weekday: 1, hour: 9, minute: 0 },
    });
  }
  if (s.notifyStreak) {
    const opens = opensToday(s.events, null, now);
    const at = new Date(now);
    at.setHours(19, 0, 0, 0);
    if (streakSaverDue(opens, s.goalOpens) && at.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'klarity-streak',
        content: { title: 'Protect your streak', body: `You're close to today's limit of ${s.goalOpens} opens. One pause at a time.` },
        trigger: { type: T.DATE, date: at },
      });
    }
  }
}
