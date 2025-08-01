import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface AnimatedButtonProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  color?: string;
  index?: number; // For staggered animations
  delay?: number; // Custom delay for animation
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function AnimatedButton({
  label,
  description,
  icon,
  selected = false,
  onPress,
  style,
  labelStyle,
  descriptionStyle,
  color = '#22C55E',
  index = 0,
  delay = 0,
}: AnimatedButtonProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const pressed = useSharedValue(0);
  
  // Initial animation on mount
  useEffect(() => {
    const baseDelay = 300; // Base delay for first item
    const staggerDelay = 100; // Additional delay per item for staggered effect
    const totalDelay = baseDelay + (index * staggerDelay) + delay;
    
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 500 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }, totalDelay);
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    const pressScale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.98],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value * pressScale },
      ],
    };
  });
  
  const selectedStyle = selected ? {
    backgroundColor: color,
    borderColor: color,
  } : {};
  
  const selectedTextStyle = selected ? {
    color: '#FFFFFF',
  } : {};
  
  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 50, overshootClamping: true });
  };
  
  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 50, overshootClamping: true });
  };

  return (
    <AnimatedTouchable
      style={[styles.container, selectedStyle, containerStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <View style={styles.content}>
        {icon && (
          <View style={[styles.iconContainer, selected && { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            {icon}
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.label, selectedTextStyle, labelStyle]}>{label}</Text>
          {description && (
            <Text style={[styles.description, selectedTextStyle, descriptionStyle]}>{description}</Text>
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});