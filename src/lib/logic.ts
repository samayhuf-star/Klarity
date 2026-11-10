// Pure logic: no React / native imports so it can be unit-tested with node.

export type Window = { days: number[]; startHour: number; endHour: number };

export type AppRule = {
  id: string;
  name: string;
  scheme: string; // URL scheme used to open the app, e.g. instagram://
  baseDelay: number; // seconds
  growBy: number; // extra seconds per open already made today
  dailyOpens: number; // 0 = no limit
  strict: boolean; // true: no way through when limit reached or in a block window
  graceMin: number; // minutes during which re-opens are not intercepted
  window: Window | null;
};

export type EventKind = 'pause' | 'open' | 'skip';
export type Ev = { t: number; app: string; kind: EventKind; ext?: boolean; swap?: string };

export const MAX_DELAY = 120;
export const DAY_MS = 86_400_000;

export function dayKey(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function opensToday(events: Ev[], appId: string | null, now: number): number {
  const k = dayKey(now);
  return events.filter((e) => e.kind === 'open' && dayKey(e.t) === k && (appId === null || e.app === appId)).length;
}

export function inWindow(w: Window | null, now: number): boolean {
  if (!w) return false;
  const d = new Date(now);
  const h = d.getHours() + d.getMinutes() / 60;
  const { startHour: s, endHour: e } = w;
  if (s === e) return false;
  if (s < e) return w.days.includes(d.getDay()) && h >= s && h < e;
  // overnight window: belongs to the day it started on
  if (h >= s) return w.days.includes(d.getDay());
  const prev = (d.getDay() + 6) % 7;
  return h < e && w.days.includes(prev);
}

export type Decision = {
  delay: number;
  blocked: null | 'window' | 'limit';
  overLimit: boolean;
  inBlockWindow: boolean;
};

export function decide(rule: AppRule, opensTodayForApp: number, now: number): Decision {
  const overLimit = rule.dailyOpens > 0 && opensTodayForApp >= rule.dailyOpens;
  const inBlockWindow = inWindow(rule.window, now);
  let delay = rule.baseDelay + rule.growBy * opensTodayForApp;
  if (overLimit || inBlockWindow) delay *= 2;
  delay = Math.max(3, Math.min(MAX_DELAY, Math.round(delay)));
  let blocked: Decision['blocked'] = null;
  if (rule.strict && inBlockWindow) blocked = 'window';
  else if (rule.strict && overLimit) blocked = 'limit';
  return { delay, blocked, overLimit, inBlockWindow };
}

export const PROMPTS = [
  'Is this what you meant to do right now?',
  'What are you hoping to find in there?',
  'Will you be glad you opened it in an hour?',
  'Take one breath. Still want it?',
  'What would you rather be doing for the next 10 minutes?',
  'Are you bored, tired, or avoiding something?',
  'Your thumb opened it. Did you?',
];

export function promptFor(appId: string, opens: number): string {
  let h = 0;
  for (const c of appId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PROMPTS[(h + opens) % PROMPTS.length];
}

export const SWAPS = ['Drink a glass of water', 'Stand up and stretch', 'Message a friend', 'Step outside for a minute', 'Write down one thing to do next'];

export type DayStat = { key: string; opens: number; skips: number; pauses: number };

export function dayStats(events: Ev[], now: number, days: number): DayStat[] {
  const out: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(now - i * DAY_MS);
    out.push({ key, opens: 0, skips: 0, pauses: 0 });
  }
  const idx = new Map(out.map((d, i) => [d.key, i]));
  for (const e of events) {
    const i = idx.get(dayKey(e.t));
    if (i === undefined) continue;
    if (e.kind === 'open') out[i].opens++;
    else if (e.kind === 'skip') out[i].skips++;
    else out[i].pauses++;
  }
  return out;
}

// Streak = consecutive days with opens <= goal, counted back from today.
// "Life happens" rule: one missed day per rolling 7 days is forgiven instead of resetting the streak.
export function computeStreak(events: Ev[], goal: number, firstUse: number, now: number): { streak: number; forgiven: number } {
  const days = Math.max(1, Math.min(365, Math.floor((now - firstUse) / DAY_MS) + 1));
  const stats = dayStats(events, now, days);
  let streak = 0;
  let forgiven = 0;
  let lastForgivenAgo = Infinity;
  for (let i = stats.length - 1, ago = 0; i >= 0; i--, ago++) {
    const ok = stats[i].opens <= goal;
    if (ok) {
      // today only counts once the day is over, but never breaks the streak
      if (ago > 0 || stats[i].opens <= goal) streak++;
      lastForgivenAgo++;
    } else if (ago === 0) {
      // today is still in progress; a miss today is not final until midnight, but stop counting today
      continue;
    } else if (lastForgivenAgo >= 7) {
      forgiven++;
      lastForgivenAgo = 0;
    } else {
      break;
    }
  }
  return { streak, forgiven };
}

export function minutesReclaimed(skips: number, avgSessionMin: number): number {
  return Math.round(skips * avgSessionMin);
}

export function fmtDelay(sec: number): string {
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export function prune(events: Ev[], now: number, keepDays = 90): Ev[] {
  const cutoff = now - keepDays * DAY_MS;
  return events.filter((e) => e.t >= cutoff);
}
