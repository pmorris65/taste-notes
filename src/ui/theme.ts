import { useColorScheme } from 'react-native';

import { useStore } from '../state/store';
import { PALETTES, type Colors } from './palettes';

export type { Colors };

export function verdictColor(c: Colors, verdict: 'like' | 'meh' | 'dislike'): string {
  return verdict === 'like' ? c.like : verdict === 'dislike' ? c.dislike : c.muted;
}

/** The colours for the chosen food theme, in light or dark to match the phone. */
export function useColors(): Colors {
  const theme = useStore((s) => s.settings.theme);
  const palette = PALETTES[theme] ?? PALETTES.coffee;
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

/** Type scale, loosely following iOS text styles. */
export const type = {
  largeTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  subhead: { fontSize: 15, lineHeight: 20 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
} as const;

/** Don't let headers and fixed-size controls grow without limit at the largest text sizes. */
export const MAX_FONT_SCALE = 1.5;
