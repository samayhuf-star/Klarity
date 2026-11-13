import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AppRule, type Ev, prune } from './logic';

export type State = {
  v: 1;
  onboarded: boolean;
  firstUse: number;
  rules: AppRule[];
  events: Ev[];
  goalOpens: number; // daily total-opens goal
  avgSessionMin: number;
  graceUntil: Record<string, number>;
  lastBounce: Record<string, number>;
  lastExternalPause: number | null;
  reminders: boolean;
  lockPin: string | null;
  lockUntil: number;
};

export const initialState = (): State => ({
  v: 1,
  onboarded: false,
  firstUse: Date.now(),
  rules: [],
  events: [],
  goalOpens: 15,
  avgSessionMin: 6,
  graceUntil: {},
  lastBounce: {},
  lastExternalPause: null,
  reminders: false,
  lockPin: null,
  lockUntil: 0,
});

const KEY = 'klarity.state.v1';

type Ctx = {
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
  replace: (s: State) => void;
  locked: boolean;
};

const StoreCtx = createContext<Ctx | null>(null);

export function validate(raw: unknown): State | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<State>;
  if (r.v !== 1 || !Array.isArray(r.rules) || !Array.isArray(r.events)) return null;
  return { ...initialState(), ...r } as State;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState());
  const [ready, setReady] = useState(false);
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    (async () => {
      try {
        const s = await AsyncStorage.getItem(KEY);
        if (s) {
          const v = validate(JSON.parse(s));
          if (v) setState(v);
        }
      } catch {
        // corrupted storage: start fresh rather than crash
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify({ ...state, events: prune(state.events, Date.now()) })).catch(() => {});
    }, 150);
    return () => clearTimeout(t);
  }, [state, ready]);

  const update = useCallback((fn: (s: State) => State) => setState((s) => fn(s)), []);
  const replace = useCallback((s: State) => setState(s), []);
  const locked = state.lockUntil > Date.now();
  const value = useMemo(() => ({ state, ready, update, replace, locked }), [state, ready, update, replace, locked]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}

export function addEvent(s: State, e: Ev): State {
  return { ...s, events: [...s.events, e] };
}
