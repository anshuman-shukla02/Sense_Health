// Sense Health — Animated Entry Wrapper
// Reusable entering animation using react-native-reanimated
import React from 'react';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeInLeft, FadeInRight,
  SlideInDown, SlideInUp, SlideInLeft, SlideInRight,
  ZoomIn, BounceIn, BounceInDown,
  Layout,
} from 'react-native-reanimated';

const PRESETS = {
  fadeUp: FadeInUp.springify().damping(18).stiffness(120),
  fadeDown: FadeInDown.springify().damping(18).stiffness(120),
  fadeLeft: FadeInLeft.springify().damping(18).stiffness(120),
  fadeRight: FadeInRight.springify().damping(18).stiffness(120),
  slideUp: SlideInUp.springify().damping(16).stiffness(100),
  slideDown: SlideInDown.springify().damping(16).stiffness(100),
  slideLeft: SlideInLeft.springify().damping(16).stiffness(100),
  slideRight: SlideInRight.springify().damping(16).stiffness(100),
  zoom: ZoomIn.springify().damping(14).stiffness(100),
  bounce: BounceIn,
  bounceDown: BounceInDown,
  fade: FadeIn.duration(500),
};

export default function AnimatedEntry({
  children,
  preset = 'fadeUp',
  delay = 0,
  duration,
  style,
  layout = false,
}) {
  const entering = PRESETS[preset]
    ? PRESETS[preset].delay(delay)
    : FadeInUp.springify().damping(18).stiffness(120).delay(delay);

  return (
    <Animated.View
      entering={entering}
      layout={layout ? Layout.springify().damping(18) : undefined}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// Re-export Animated for convenience
export { default as ReAnimated } from 'react-native-reanimated';
