import { useColorScheme } from 'react-native';

/** A warm, menu-card palette. */
export interface Colors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
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
  border: '#E0D7C9',
  text: '#2A2522',
  muted: '#6F665E',
  accent: '#B5562F',
  accentSoft: '#F4DFD3',
  onAccent: '#FFFFFF',
  like: '#2E7D4F',
  likeSoft: '#DCEFE2',
  dislike: '#B03A2E',
  dislikeSoft: '#F6DEDA',
  danger: '#A8412F',
  warningSoft: '#F6E3DC',
};

const dark: Colors = {
  background: '#171412',
  surface: '#221E1B',
  surfaceAlt: '#2C2724',
  border: '#3A3430',
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

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
