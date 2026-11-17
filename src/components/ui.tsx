import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const C = {
  bg: '#12162B',
  card: '#1C2240',
  line: '#2C345C',
  fg: '#F4F1EA',
  mut: '#A3A9C9',
  acc: '#FFB547',
  accDim: '#4A3A1E',
  sky: '#7F8CFF',
  onAcc: '#1B1303',
  warn: '#FFB547',
  bad: '#FF8A7A',
};
export const F = { head: 'SpaceGrotesk_700Bold', headMed: 'SpaceGrotesk_500Medium', body: 'Inter_400Regular', bodyBold: 'Inter_600SemiBold' };

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
  label, onPress, kind = 'primary', disabled, hint, testID,
}: { label: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; hint?: string; testID?: string }) {
  const bg = kind === 'primary' ? C.acc : kind === 'danger' ? C.bad : 'transparent';
  const color = kind === 'ghost' ? C.fg : C.onAcc;
  return (
    <Pressable
      testID={testID}
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

export function Chip({ label, on, onPress, disabled, testID }: { label: string; on: boolean; onPress: () => void; disabled?: boolean; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: on, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[s.chip, on && { backgroundColor: C.accDim, borderColor: C.acc }, disabled && { opacity: 0.4 }]}
    >
      <Text style={{ color: on ? C.fg : C.mut, fontSize: 14, fontFamily: F.body }}>{label}</Text>
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
  h1: { color: C.fg, fontSize: 32, fontFamily: F.head, marginBottom: 4 },
  h2: { color: C.fg, fontSize: 20, fontFamily: F.head, marginTop: 20, marginBottom: 8 },
  p: { color: C.fg, fontSize: 16, lineHeight: 23, fontFamily: F.body },
  card: { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  btn: { borderWidth: 1, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  btnText: { fontSize: 17, fontFamily: F.bodyBold },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  sq: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  sqText: { color: C.fg, fontSize: 22 },
});

export function Ring({ size = 200, stroke = 14, progress, color = C.acc, children }: { size?: number; stroke?: number; progress: number; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${circ * p} ${circ}`} rotation={-90} originX={size / 2} originY={size / 2}
        />
      </Svg>
      {children}
    </View>
  );
}
