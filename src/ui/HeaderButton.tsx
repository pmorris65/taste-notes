import { Pressable, Text, type ColorValue } from 'react-native';

import { MAX_FONT_SCALE } from './theme';

/**
 * A text button for the navigation bar (Edit, Cancel, Save) with a proper
 * 44pt touch target. Uses the header's tint colour.
 */
export function HeaderButton({
  title,
  onPress,
  tintColor,
  bold,
  disabled,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  tintColor?: ColorValue;
  bold?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: 44,
        minWidth: 44,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={{ color: tintColor, fontSize: 17, fontWeight: bold ? '600' : '400' }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
