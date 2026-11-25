import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number; // how small it gets while pressed
  children?: ReactNode;
};

// A pressable that shrinks a little the moment a finger lands and springs back on release.
// The press itself fires on release, so the shrink is the instant feedback and the screen
// change that follows is the result. It runs on the UI thread, so it never waits for React.
export function PressableScale({
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  // Keep any opacity the caller set (for example a dimmed, disabled button).
  const baseOpacity = StyleSheet.flatten(style)?.opacity ?? 1;

  const animated = useAnimatedStyle(() => ({
    opacity: baseOpacity * interpolate(pressed.value, [0, 1], [1, 0.9]),
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, scaleTo]) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        // Tiny and brief, so it stays on even with Reduce Motion: people need to see a press land.
        pressed.value = withTiming(1, {
          duration: 70,
          easing: Easing.out(Easing.quad),
          reduceMotion: ReduceMotion.Never,
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, {
          damping: 16,
          stiffness: 320,
          mass: 0.6,
          reduceMotion: ReduceMotion.Never,
        });
        onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
