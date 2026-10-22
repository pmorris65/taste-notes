import { useColorScheme } from 'react-native';

/** A warm, menu-card palette. Pairs are checked against WCAG AA in both themes. */
export interface Colors {
  background: string;
  surface: string;
  surfaceAlt: string;
  /** The selected segment of a segmented control, raised above its track. */
  surfaceRaised: string;
  /** Decorative hairlines around cards and sections. */
  border: string;
  /** Edges of controls (inputs, chips, switch track): at least 3:1 against what they sit on. */
  controlBorder: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  like: string;
  likeSoft: string;
  dislike: string;
  dislikeSoft: string;
  danger: string;
  warningSoft: string;
}

const light: Colors = {
  background: '#F7F3EC',
  surface: '#FFFFFF',
  surfaceAlt: '#EFE8DD',
  surfaceRaised: '#FFFFFF',
  border: '#D3C8B8',
  controlBorder: '#8C8177',
  text: '#2A2522',
  muted: '#6F665E',
  accent: '#A84E29',
  accentSoft: '#F4DFD3',
  onAccent: '#FFFFFF',
  like: '#276B43',
  likeSoft: '#DCEFE2',
  dislike: '#B03A2E',
  dislikeSoft: '#F6DEDA',
  danger: '#A8412F',
  warningSoft: '#F6E3DC',
};

const dark: Colors = {
  background: '#171412',
  surface: '#262220',
  surfaceAlt: '#332D29',
  surfaceRaised: '#4A423C',
  border: '#4A423C',
  controlBorder: '#857A70',
  text: '#F0EBE4',
  muted: '#A79E95',
  accent: '#E08A62',
  accentSoft: '#3E2A20',
  onAccent: '#1B0F0A',
  like: '#7CC898',
  likeSoft: '#1F3327',
  dislike: '#EC8A7E',
  dislikeSoft: '#3D2320',
  danger: '#E08A77',
  warningSoft: '#3B2621',
};

export function verdictColor(c: Colors, verdict: 'like' | 'meh' | 'dislike'): string {
  return verdict === 'like' ? c.like : verdict === 'dislike' ? c.dislike : c.muted;
}

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
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
