import { PALETTES, type Colors } from '../palettes';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

type Key = keyof Colors;
/** [foreground, background, minimum ratio] for every pair the UI draws. 4.5 for text, 3 for control edges. */
const PAIRS: [Key, Key, number][] = [
  ['text', 'background', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'surfaceAlt', 4.5],
  ['text', 'surfaceRaised', 4.5],
  ['text', 'warningSoft', 4.5],
  ['muted', 'background', 4.5],
  ['muted', 'surface', 4.5],
  ['muted', 'surfaceAlt', 4.5],
  ['onAccent', 'accent', 4.5],
  ['accent', 'background', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'accentSoft', 3],
  ['like', 'background', 4.5],
  ['like', 'surface', 4.5],
  ['like', 'likeSoft', 4.5],
  ['dislike', 'background', 4.5],
  ['dislike', 'surface', 4.5],
  ['dislike', 'dislikeSoft', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'warningSoft', 4.5],
  ['controlBorder', 'background', 3],
  ['controlBorder', 'surface', 3],
  ['controlBorder', 'surfaceAlt', 3],
];

describe.each(Object.entries(PALETTES))('%s theme', (_name, modes) => {
  describe.each(Object.entries(modes))('%s', (_mode, colors) => {
    it.each(PAIRS)('%s on %s ≥ %d:1', (fg, bg, min) => {
      expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(min);
    });
  });
});
