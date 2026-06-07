// Sense Health — Premium Quick Action with Gradient + Press Animation
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export default function QuickAction({ icon, label, color, onPress, badge, gradient }) {
  const pressScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.9, { duration: 80 });
    iconRotation.value = withTiming(-15, { duration: 80 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 10, stiffness: 150 });
    iconRotation.value = withSequence(
      withSpring(15, { damping: 8, stiffness: 200 }),
      withSpring(0)
    );
  };

  const gradientColors = gradient || [color, color + 'CC'];

  return (
    <ReAnimated.View style={containerStyle}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <ReAnimated.View style={iconStyle}>
            <Ionicons name={icon} size={22} color="#FFFFFF" />
          </ReAnimated.View>
          {badge && <View style={styles.badge} />}
        </LinearGradient>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    </ReAnimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    width: 82,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.riskCritical,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  label: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
});
