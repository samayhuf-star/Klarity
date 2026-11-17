import Svg, { Circle, Path, Rect } from 'react-native-svg';

type P = { color: string; size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const });
const st = (color: string) => ({ stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const TodayIcon = ({ color, size = 24 }: P) => (
  <Svg {...base(size)}><Circle cx="12" cy="12" r="8" {...st(color)} /><Path d="M12 7v5l3 2" {...st(color)} /></Svg>
);
export const AppsIcon = ({ color, size = 24 }: P) => (
  <Svg {...base(size)}>
    <Rect x="4" y="4" width="6.5" height="6.5" rx="2" {...st(color)} /><Rect x="13.5" y="4" width="6.5" height="6.5" rx="2" {...st(color)} />
    <Rect x="4" y="13.5" width="6.5" height="6.5" rx="2" {...st(color)} /><Rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" {...st(color)} />
  </Svg>
);
export const InsightsIcon = ({ color, size = 24 }: P) => (
  <Svg {...base(size)}><Path d="M5 20V11M12 20V4M19 20v-6" {...st(color)} /></Svg>
);
export const SettingsIcon = ({ color, size = 24 }: P) => (
  <Svg {...base(size)}><Circle cx="12" cy="12" r="3" {...st(color)} /><Path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" {...st(color)} /></Svg>
);
