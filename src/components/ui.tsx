import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const C = {
  bg: '#0E1514',
  card: '#17211F',
  line: '#26332F',
  fg: '#EEF3F1',
  mut: '#9DB0AA',
  acc: '#5FB59D',
  accDim: '#2B5A4D',
  warn: '#E9A458',
  bad: '#E8765F',
};

export function Screen({ children, scroll = true, pad = true }: { children: React.ReactNode; scroll?: boolean; pad?: boolean }) {
  const insets = useSafeAreaInsets();
  const inner = { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: pad ? 18 : 0 };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: C.bg }, inner]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={inner} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export const H1 = ({ children }: { children: React.ReactNode }) => (
  <Text accessibilityRole="header" style={s.h1}>{children}</Text>
);
export const H2 = ({ children }: { children: React.ReactNode }) => (
  <Text accessibilityRole="header" style={s.h2}>{children}</Text>
);
export const P = ({ children, dim, style }: { children: React.ReactNode; dim?: boolean; style?: object }) => (
  <Text style={[s.p, dim && { color: C.mut }, style]}>{children}</Text>
);

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  label, onPress, kind = 'primary', disabled, hint,
}: { label: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; hint?: string }) {
  const bg = kind === 'primary' ? C.acc : kind === 'danger' ? C.bad : 'transparent';
  const color = kind === 'ghost' ? C.fg : '#08201A';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: kind === 'ghost' ? C.line : bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[s.btnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, disabled }: { label: string; on: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[s.chip, on && { backgroundColor: C.accDim, borderColor: C.acc }, disabled && { opacity: 0.4 }]}
    >
      <Text style={{ color: on ? C.fg : C.mut, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Stepper({
  label, value, min, max, step = 1, onChange, fmt, disabled,
}: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string; disabled?: boolean }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <View style={s.stepper}>
      <Text style={[s.p, { flex: 1 }]}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} disabled={disabled} onPress={dec} style={[s.sq, disabled && { opacity: 0.4 }]}>
        <Text style={s.sqText}>−</Text>
      </Pressable>
      <Text accessibilityLabel={`${label} ${fmt ? fmt(value) : value}`} style={[s.p, { minWidth: 64, textAlign: 'center' }]}>{fmt ? fmt(value) : value}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} disabled={disabled} onPress={inc} style={[s.sq, disabled && { opacity: 0.4 }]}>
        <Text style={s.sqText}>+</Text>
      </Pressable>
    </View>
  );
}

export function Bar({ value, max, color = C.acc }: { value: number; max: number; color?: string }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }} style={{ height: 8, backgroundColor: C.line, borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: 8, backgroundColor: color }} />
    </View>
  );
}

const s = StyleSheet.create({
  h1: { color: C.fg, fontSize: 30, fontWeight: '700', marginBottom: 4 },
  h2: { color: C.fg, fontSize: 19, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  p: { color: C.fg, fontSize: 16, lineHeight: 22 },
  card: { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  btn: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '600' },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  sq: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  sqText: { color: C.fg, fontSize: 22 },
});
