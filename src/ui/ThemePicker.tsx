import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { THEMES, type ThemeName } from '../domain/types';
import { PALETTES } from './palettes';
import { spacing, type, useColors } from './theme';

/** Food colour themes as a single-choice list, each with a preview of its colours. */
export function ThemePicker({ value, onChange }: { value: ThemeName; onChange: (t: ThemeName) => void }) {
  const c = useColors();
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Colour theme"
      style={[styles.group, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      {THEMES.map((t, i) => {
        const p = PALETTES[t.value][mode];
        const selected = t.value === value;
        return (
          <Pressable
            key={t.value}
            accessibilityRole="radio"
            accessibilityLabel={t.label}
            accessibilityHint={t.description}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(t.value)}
            style={({ pressed }) => [
              styles.row,
              i < THEMES.length - 1 && { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth },
              { backgroundColor: pressed ? c.surfaceAlt : 'transparent' },
            ]}
          >
            <View style={[styles.swatches, { backgroundColor: p.background, borderColor: c.controlBorder }]}>
              {[p.accent, p.highlight, p.like].map((color, j) => (
                <View key={j} style={[styles.dot, { backgroundColor: color }]} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { color: c.text, fontWeight: selected ? '600' : '400' }]}>{t.label}</Text>
              <Text style={[type.footnote, { color: c.muted }]}>{t.description}</Text>
            </View>
            {selected ? <Feather name="check" size={20} color={c.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 12, minHeight: 56 },
  swatches: { flexDirection: 'row', gap: 3, padding: 5, borderRadius: 12, borderWidth: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
