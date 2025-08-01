import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useEffect } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  Easing
} from 'react-native-reanimated';

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({ progress, size, strokeWidth, color, backgroundColor }: ProgressRingProps) {
  const animatedProgress = useSharedValue(0);
  const overfillProgress = useSharedValue(0);
  const breathingScale = useSharedValue(1);
  const elevationY = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Check if we're in danger mode (over 100%)
  const isDangerMode = progress > 100;
  const baseProgress = Math.min(progress, 100);
  const overfillAmount = Math.max(0, progress - 100);

  useEffect(() => {
animatedProgress.value = withTiming(isDangerMode ? 100 : baseProgress, { duration: 1000 });

    
   if (isDangerMode) {
  overfillProgress.value = withSequence(
    withTiming(0, { duration: 0 }), // Set to 0 immediately
    withTiming(0, { duration: 1000 }), // Stay at 0 for 1 second (while green fills)
    withTiming(overfillAmount, { duration: 1000 }) // Then animate red
  );
} else {
  overfillProgress.value = withTiming(0, { duration: 1000 });
}



    // Danger mode: faster, more intense animations
    const breathingDuration = isDangerMode ? 800 : 2000;
    const floatingDuration = isDangerMode ? 1000 : 2500;
    const breathingIntensity = isDangerMode ? 1.05 : 1.02;
    const floatingIntensity = isDangerMode ? 4 : 2;
    
    // Breathing effect - faster and more intense in danger mode
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(breathingIntensity, { duration: breathingDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: breathingDuration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Floating effect - faster and more dramatic in danger mode
    elevationY.value = withRepeat(
      withSequence(
        withTiming(-floatingIntensity, { duration: floatingDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(floatingIntensity, { duration: floatingDuration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Glow intensity based on progress or danger mode
    glowIntensity.value = withTiming(isDangerMode ? 1 : progress / 100, { duration: 1000 });
  }, [progress, isDangerMode, baseProgress, overfillAmount]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });

const overfillAnimatedProps = useAnimatedProps(() => {
  const maxOverfill = 50;
  const clampedOverfill = Math.min(overfillProgress.value, maxOverfill);
  const redCircumference = 2 * Math.PI * radius; // Recalculate here
  return {
    strokeDashoffset: redCircumference - (clampedOverfill / 100) * redCircumference,
  };
});

  // 3D container style with multiple shadows and transforms
  const containerStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(glowIntensity.value, [0, 1], [0.15, 0.35]);
    const shadowRadius = interpolate(glowIntensity.value, [0, 1], [15, 25]);
    
    return {
      transform: [
        { scale: breathingScale.value },
        { translateY: elevationY.value },
        { rotateX: '2deg' },
        { perspective: 1000 }
      ],
      shadowOpacity,
      shadowRadius,
    };
  });

  // Dynamic shadow color based on danger mode
  const shadowColor = isDangerMode ? '#EF4444' : '#22C55E';

  return (
    <View style={[styles.outerContainer, { width: size + 40, height: size + 40 }]}>
      {/* Multiple shadow layers for depth */}
      <Animated.View style={[styles.shadowLayer1, containerStyle, { shadowColor }]} />
      <Animated.View style={[styles.shadowLayer2, containerStyle, { shadowColor }]} />
      
      {/* Main ring container */}
      <Animated.View style={[
        styles.container, 
        { width: size, height: size, shadowColor },
        containerStyle
      ]}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background Circle - Full outline */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Base Progress Circle - Green (0-100%) */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            animatedProps={animatedProps}
          />
          
          {/* Overfill Progress Circle - Red (100%+) */}
          {isDangerMode && (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#EF4444"
              strokeWidth={strokeWidth }
              fill="none"
              strokeDasharray={circumference}
              strokeLinecap="round"
transform={`rotate(-90 ${size / 2} ${size / 2})`}
              animatedProps={overfillAnimatedProps}
            />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shadowLayer1: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  shadowLayer2: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 1000,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
});