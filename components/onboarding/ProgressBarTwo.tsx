import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface ProgressBarTwoProps {
  currentStep: number;
  totalSteps: number;
  color?: string;
  height?: number;
  showText?: boolean;
}

export function ProgressBarTwo({
  currentStep,
  totalSteps,
  color = '#22C55E',
  height = 8,
  showText = true,
}: ProgressBarTwoProps) {
  const progress = useSharedValue(0);
  
  useEffect(() => {
    // Animate progress when currentStep changes
    progress.value = withTiming(
      currentStep / totalSteps,
      {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }
    );
  }, [currentStep, totalSteps]);
  
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });
  
  return (
    <View style={styles.container}>
      <View style={[styles.progressBar, { height }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: color, height },
            progressStyle,
          ]}
        />
      </View>
      
      {showText && (
        <Text style={styles.progressText}>
          {currentStep}/{totalSteps}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  progressBar: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});