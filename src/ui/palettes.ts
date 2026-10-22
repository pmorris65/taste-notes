import type { ThemeName } from '../domain/types';

/** Colour tokens. Every pair the UI draws is checked against WCAG AA in __tests__/palettes.test.ts. */
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
  /** The theme's signature food colour (caramel, basil, mustard, citrus). Decoration only, never text. */
  highlight: string;
  onAccent: string;
  like: string;
  likeSoft: string;
  dislike: string;
  dislikeSoft: string;
  danger: string;
  warningSoft: string;
}

export const PALETTES: Record<ThemeName, { light: Colors; dark: Colors }> = {
  coffee: {
    light: {
      background: '#F6EFE6',
      surface: '#FFFCF8',
      surfaceAlt: '#EDE3D6',
      surfaceRaised: '#FFFFFF',
      border: '#DDD0BF',
      controlBorder: '#8E7F70',
      text: '#2B211B',
      muted: '#6E6056',
      accent: '#9A5424',
      accentSoft: '#F3E2D0',
      highlight: '#C98A4B',
      onAccent: '#FFFFFF',
      like: '#4D6E2F',
      likeSoft: '#E3EDD6',
      dislike: '#A63A3A',
      dislikeSoft: '#F5DEDC',
      danger: '#A63A3A',
      warningSoft: '#F5E1DC',
    },
    dark: {
      background: '#1B1512',
      surface: '#27201C',
      surfaceAlt: '#342B26',
      surfaceRaised: '#4A3F38',
      border: '#4A3F38',
      controlBorder: '#8A7B6E',
      text: '#F2EAE1',
      muted: '#AD9F92',
      accent: '#E0A06A',
      accentSoft: '#3D2C1E',
      highlight: '#C98A4B',
      onAccent: '#1F120A',
      like: '#A3C77F',
      likeSoft: '#26301D',
      dislike: '#EB8F86',
      dislikeSoft: '#3D2321',
      danger: '#EB8F86',
      warningSoft: '#3B2522',
    },
  },
  tomato: {
    light: {
      background: '#FBF6EC',
      surface: '#FFFFFF',
      surfaceAlt: '#F1E9DA',
      surfaceRaised: '#FFFFFF',
      border: '#DED3BF',
      controlBorder: '#8A8072',
      text: '#2A2320',
      muted: '#6B6259',
      accent: '#C0322A',
      accentSoft: '#FADBD6',
      highlight: '#5E9B4E',
      onAccent: '#FFFFFF',
      like: '#35702F',
      likeSoft: '#DDEED9',
      dislike: '#A3261F',
      dislikeSoft: '#F7DAD7',
      danger: '#A3261F',
      warningSoft: '#F8E0DB',
    },
    dark: {
      background: '#1A1513',
      surface: '#26201D',
      surfaceAlt: '#322A26',
      surfaceRaised: '#483E39',
      border: '#483E39',
      controlBorder: '#877B72',
      text: '#F3ECE6',
      muted: '#ACA197',
      accent: '#F07A6E',
      accentSoft: '#45211D',
      highlight: '#6FAF5F',
      onAccent: '#1E0B08',
      like: '#8CC985',
      likeSoft: '#1F3320',
      dislike: '#F2938A',
      dislikeSoft: '#432220',
      danger: '#F2938A',
      warningSoft: '#3E2321',
    },
  },
  diner: {
    light: {
      background: '#FFFDF7',
      surface: '#FFFFFF',
      surfaceAlt: '#FBF1D6',
      surfaceRaised: '#FFFFFF',
      border: '#EADFC0',
      controlBorder: '#8C8270',
      text: '#231F20',
      muted: '#66605A',
      accent: '#C8102E',
      accentSoft: '#FDEBB0',
      highlight: '#F2B705',
      onAccent: '#FFFFFF',
      like: '#4A7224',
      likeSoft: '#E4EFD3',
      dislike: '#A50E26',
      dislikeSoft: '#F9D9DD',
      danger: '#A50E26',
      warningSoft: '#FBE0E3',
    },
    dark: {
      background: '#18161A',
      surface: '#242128',
      surfaceAlt: '#302C35',
      surfaceRaised: '#46414C',
      border: '#46414C',
      controlBorder: '#857E8C',
      text: '#F4F1EC',
      muted: '#ABA5AE',
      accent: '#F5C02A',
      accentSoft: '#3D3212',
      highlight: '#F2B705',
      onAccent: '#1A1406',
      like: '#9BCB6B',
      likeSoft: '#24301A',
      dislike: '#FF8A93',
      dislikeSoft: '#42202A',
      danger: '#FF8A93',
      warningSoft: '#3E2126',
    },
  },
  avocado: {
    light: {
      background: '#FAF8F1',
      surface: '#FFFFFF',
      surfaceAlt: '#EEF0E2',
      surfaceRaised: '#FFFFFF',
      border: '#D9DCC7',
      controlBorder: '#7F8573',
      text: '#1F241C',
      muted: '#5F6658',
      accent: '#4C7A34',
      accentSoft: '#FCE4CC',
      highlight: '#F28C28',
      onAccent: '#FFFFFF',
      like: '#3F6E2A',
      likeSoft: '#E0EDD3',
      dislike: '#B02E3A',
      dislikeSoft: '#F6DADD',
      danger: '#B02E3A',
      warningSoft: '#F8E1E0',
    },
    dark: {
      background: '#141712',
      surface: '#1F241C',
      surfaceAlt: '#2A3026',
      surfaceRaised: '#3F473A',
      border: '#3F473A',
      controlBorder: '#7C8673',
      text: '#EEF1E8',
      muted: '#A3AB98',
      accent: '#9CCB6E',
      accentSoft: '#3A2A14',
      highlight: '#F28C28',
      onAccent: '#10180A',
      like: '#9CCB6E',
      likeSoft: '#22301A',
      dislike: '#F08A93',
      dislikeSoft: '#3D2024',
      danger: '#F08A93',
      warningSoft: '#3A2124',
    },
  },
};
