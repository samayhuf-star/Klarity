import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, inWindow, computeStreak, dayKey, opensToday, DAY_MS, type AppRule, type Ev } from './logic.ts';

const rule: AppRule = {
  id: 'ig', name: 'Instagram', scheme: 'instagram://', baseDelay: 10, growBy: 5,
  dailyOpens: 3, strict: false, graceMin: 5, window: null,
};
const NOW = new Date(2026, 10, 11, 14, 0, 0).getTime(); // Wed 11 Nov 2026 14:00 local

test('delay grows with opens and is capped', () => {
  assert.equal(decide(rule, 0, NOW).delay, 10);
  assert.equal(decide(rule, 2, NOW).delay, 20);
  assert.equal(decide({ ...rule, dailyOpens: 0 }, 100, NOW).delay, 120);
});

test('over limit doubles delay; strict blocks', () => {
  const soft = decide(rule, 3, NOW);
  assert.equal(soft.overLimit, true);
  assert.equal(soft.blocked, null);
  assert.equal(soft.delay, 50);
  assert.equal(decide({ ...rule, strict: true }, 3, NOW).blocked, 'limit');
});

test('window same-day and overnight', () => {
  const wed = new Date(NOW).getDay();
  assert.equal(inWindow({ days: [wed], startHour: 9, endHour: 17 }, NOW), true);
  assert.equal(inWindow({ days: [wed], startHour: 15, endHour: 17 }, NOW), false);
  const night = new Date(2026, 10, 12, 1, 0).getTime(); // Thu 01:00, window started Wed 22:00
  assert.equal(inWindow({ days: [wed], startHour: 22, endHour: 6 }, night), true);
  assert.equal(inWindow({ days: [new Date(night).getDay()], startHour: 22, endHour: 6 }, night), false);
  assert.equal(inWindow(null, NOW), false);
});

test('strict window blocks', () => {
  const wed = new Date(NOW).getDay();
  const r = { ...rule, strict: true, window: { days: [wed], startHour: 9, endHour: 17 } };
  assert.equal(decide(r, 0, NOW).blocked, 'window');
});

test('opensToday counts only today opens for the app', () => {
  const ev: Ev[] = [
    { t: NOW, app: 'ig', kind: 'open' },
    { t: NOW, app: 'ig', kind: 'skip' },
    { t: NOW, app: 'tt', kind: 'open' },
    { t: NOW - DAY_MS, app: 'ig', kind: 'open' },
  ];
  assert.equal(opensToday(ev, 'ig', NOW), 1);
  assert.equal(opensToday(ev, null, NOW), 2);
});

function opens(n: number, t: number): Ev[] {
  return Array.from({ length: n }, () => ({ t, app: 'ig', kind: 'open' as const }));
}

test('streak counts good days', () => {
  const first = NOW - 4 * DAY_MS;
  const ev: Ev[] = [];
  for (let i = 0; i < 5; i++) ev.push(...opens(2, NOW - i * DAY_MS));
  assert.equal(computeStreak(ev, 5, first, NOW).streak, 5);
});

test('one miss in 7 days is forgiven, two break', () => {
  const first = NOW - 6 * DAY_MS;
  const base: Ev[] = [];
  for (let i = 0; i < 7; i++) base.push(...opens(1, NOW - i * DAY_MS));
  const oneMiss = [...base, ...opens(20, NOW - 3 * DAY_MS)];
  const r1 = computeStreak(oneMiss, 5, first, NOW);
  assert.equal(r1.forgiven, 1);
  assert.equal(r1.streak, 6);
  const twoMiss = [...oneMiss, ...opens(20, NOW - 1 * DAY_MS)];
  const r2 = computeStreak(twoMiss, 5, first, NOW);
  assert.ok(r2.streak < 6);
});

test('dayKey is stable', () => {
  assert.equal(dayKey(NOW), '2026-11-11');
});
