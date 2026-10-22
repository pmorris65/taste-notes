import type { ReactNode, Ref } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { MAX_FONT_SCALE, radius, spacing, type, useColors } from './theme';

export function Screen({
  title,
  subtitle,
  right,
  children,
  scroll = true,
  edges = ['top'],
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
}) {
  const c = useColors();
  const header = title ? (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text
          style={[type.largeTitle, { color: c.text }]}
          accessibilityRole="header"
          maxFontSizeMultiplier={MAX_FONT_SCALE}
        >
          {title}
        </Text>
        {subtitle ? <Text style={[type.subhead, { color: c.muted, marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  ) : null;
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: c.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, style]}>{children}</View>
  );
}

/** A small uppercase label. Pass `header` when it titles a group, so screen readers can jump to it. */
export function Label({
  children,
  style,
  header,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  header?: boolean;
}) {
  const c = useColors();
  return (
    <Text accessibilityRole={header ? 'header' : undefined} style={[styles.label, { color: c.muted }, style]}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  style,
  muted,
  numberOfLines,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  muted?: boolean;
  numberOfLines?: number;
}) {
  const c = useColors();
  return (
    <Text numberOfLines={numberOfLines} style={[type.body, { color: muted ? c.muted : c.text }, style]}>
      {children}
    </Text>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  style,
  accessibilityLabel,
  accessibilityHint,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const c = useColors();
  // Disabled buttons get readable, clearly inactive colours rather than a faded copy of the enabled ones.
  const bg = disabled
    ? kind === 'ghost'
      ? 'transparent'
      : c.surfaceAlt
    : { primary: c.accent, secondary: c.surfaceAlt, ghost: 'transparent', danger: c.warningSoft }[kind];
  const fg = disabled ? c.muted : { primary: c.onAccent, secondary: c.text, ghost: c.accent, danger: c.danger }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: pressed ? 0.75 : 1 }, style]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

/** One option of a single-choice ChipGroup. */
export function Chip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? c.accent : c.surface,
          borderColor: selected ? c.accent : c.controlBorder,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={{ color: selected ? c.onAccent : c.text, fontSize: 15, fontWeight: selected ? '600' : '400' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.chipGroup} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {children}
    </View>
  );
}

export function Section({
  title,
  titleColor,
  titleLabel,
  children,
  footer,
}: {
  title?: string;
  /** Colour for the title, e.g. green for "Liked". */
  titleColor?: string;
  /** What screen readers say instead of the title, e.g. without an emoji. */
  titleLabel?: string;
  children: ReactNode;
  footer?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.section}>
      {title ? (
        <Label header style={[styles.sectionTitle, titleColor ? { color: titleColor } : null]}>
          <Text accessibilityLabel={titleLabel}>{title}</Text>
        </Label>
      ) : null}
      <View style={[styles.sectionBody, { backgroundColor: c.surface, borderColor: c.border }]}>{children}</View>
      {footer ? <Text style={[type.footnote, styles.footer, { color: c.muted }]}>{footer}</Text> : null}
    </View>
  );
}

export function Row({
  title,
  detail,
  onPress,
  right,
  destructive,
  last,
  accessibilityLabel,
  accessibilityHint,
}: {
  title: string;
  detail?: string;
  onPress?: () => void;
  right?: ReactNode;
  destructive?: boolean;
  last?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const c = useColors();
  const content = (
    <View style={[styles.row, !last && { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { color: destructive ? c.danger : c.text }]}>{title}</Text>
        {detail ? <Text style={[type.footnote, { color: c.muted, marginTop: 2 }]}>{detail}</Text> : null}
      </View>
      {right}
      {onPress && !right && !destructive ? (
        <Text style={{ color: c.muted, fontSize: 20 }} accessible={false}>
          ›
        </Text>
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: pressed ? c.surfaceAlt : 'transparent' })}
    >
      {content}
    </Pressable>
  );
}

/** A row with a switch. The whole row is the control, so it's easy to hit and read as one thing. */
export function SwitchRow({
  title,
  detail,
  value,
  onValueChange,
  disabled,
  last,
}: {
  title: string;
  detail?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={detail}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Row
        title={title}
        detail={detail}
        last={last}
        right={
          <Switch
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            trackColor={{ true: c.accent, false: c.controlBorder }}
            ios_backgroundColor={c.controlBorder}
            // iOS draws its own thumb; elsewhere keep it white (react-native-web's default is teal).
            thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            {...(Platform.OS === 'web' ? { activeThumbColor: '#FFFFFF' } : null)}
          />
        }
      />
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  /** `a11yLabel` replaces the visible label for screen readers (e.g. to skip an emoji). */
  options: { value: T; label: string; a11yLabel?: string }[];
  value: T;
  onChange: (v: T) => void;
  /** What the choice is about, e.g. "Sort places by". */
  label: string;
}) {
  const c = useColors();
  return (
    <View
      style={[styles.segmented, { backgroundColor: c.surfaceAlt }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityLabel={o.a11yLabel}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: c.surfaceRaised, borderColor: c.controlBorder, ...styles.segmentRaised },
            ]}
          >
            <Text
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              numberOfLines={1}
              style={{ color: selected ? c.text : c.muted, fontSize: 15, fontWeight: selected ? '600' : '400' }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TextField({
  label,
  error,
  style,
  ref,
  ...props
}: TextInputProps & { label?: string; error?: string; ref?: Ref<TextInput> }) {
  const c = useColors();
  const input = (
    <TextInput
      ref={ref}
      placeholderTextColor={c.muted}
      accessibilityLabel={label ?? props.placeholder}
      aria-invalid={error ? true : undefined}
      {...props}
      style={[
        styles.input,
        { backgroundColor: c.surface, borderColor: error ? c.danger : c.controlBorder, color: c.text },
        style,
      ]}
    />
  );
  if (!label && !error) return input;
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        // The input already carries the label, so don't read it twice.
        <Label style={styles.fieldLabel}>
          <Text accessibilityElementsHidden importantForAccessibility="no">
            {label}
          </Text>
        </Label>
      ) : null}
      {input}
      {error ? (
        <Text accessibilityLiveRegion="assertive" role="alert" style={[type.footnote, styles.fieldLabel, { color: c.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.sm },
  headerRight: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, gap: spacing.md },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  fieldLabel: { marginLeft: spacing.xs },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  chip: {
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  sectionBody: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  footer: { marginHorizontal: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 52,
  },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentRaised: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
  },
});
