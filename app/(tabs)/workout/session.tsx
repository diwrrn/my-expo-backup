import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Pause, RotateCcw, ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutExerciseCard } from '@/components/WorkoutExerciseCard';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolateColor
} from 'react-native-reanimated';

interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  sets: Array<{
    reps: number;
    weight?: number;
    completed: boolean;
  }>;
  exerciseNotes: string;
  order: number;
}

export default function WorkoutSessionScreen() {
  const { planId, planName } = useLocalSearchParams<{ planId: string; planName: string }>();
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { user } = useAuth();
  
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [workoutTime, setWorkoutTime] = useState(0);
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  
  const workoutTimerRef = useRef<NodeJS.Timeout>();
  
  // Animation values
  const timerScale = useSharedValue(1);

  useEffect(() => {
    if (planId && user?.id) {
      initializeWorkoutSession();
    }
    
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [planId, user?.id]);

  useEffect(() => {
    if (isWorkoutRunning) {
      workoutTimerRef.current = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    } else {
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
      }
    }

    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [isWorkoutRunning]);

  const initializeWorkoutSession = async () => {
    if (!planId || !user?.id) return;
    
    try {
      // Load workout plan
      const plan = await FirebaseService.getWorkoutPlanById(user.id, planId);
      if (plan) {
        // Prepare session exercises with initial completion status
        const initialSessionExercises = plan.exercises.map((ex: any) => {
          // Handle both old format (number[]) and new format (object[])
          let setsData;
          if (Array.isArray(ex.reps)) {
            if (typeof ex.reps[0] === 'object') {
              // New format: array of objects with reps and weight
              setsData = ex.reps.map((setData: any) => ({
                reps: setData.reps,
                weight: setData.weight,
                completed: false,
              }));
            } else {
              // Old format: array of numbers (reps only)
              setsData = ex.reps.map((repCount: number) => ({
                reps: repCount,
                weight: ex.weight, // Use exercise's default weight
                completed: false,
              }));
            }
          } else {
            // Very old format: single number for reps
            setsData = Array(ex.sets).fill(null).map(() => ({
              reps: ex.reps,
              weight: ex.weight,
              completed: false,
            }));
          }

          return {
          ...ex,
            sets: setsData,
          exerciseNotes: '', // New field for exercise-specific notes
          };
        });
        setSessionExercises(initialSessionExercises);
      }
      
      // Create workout session
      const sessionData = {
        planId,
        startTime: new Date().toISOString(),
        completedExercises: [],
        totalTime: 0,
        status: 'in-progress' as const
      };
      
      const newSessionId = await FirebaseService.addWorkoutSession(user.id, sessionData);
      setSessionId(newSessionId);
      
      // Start stopwatch immediately
      setIsWorkoutRunning(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize workout session');
      router.back();
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

const handleToggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
  console.log('🔥 Toggle called:', { exerciseIndex, setIndex });
  
  setSessionExercises(prev => {
    console.log('📊 Previous state:', prev.map(ex => ({ 
      name: ex.exerciseName, 
      sets: ex.sets.map(s => s.completed) 
    })));
    
    // Create a completely new array with immutable updates
    const newState = prev.map((exercise, exIndex) => {
      if (exIndex === exerciseIndex) {
        // Create a new exercise object with updated sets
        const updatedExercise = {
          ...exercise,
          sets: exercise.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              // Create a new set object with toggled completion
              return {
                ...set,
                completed: !set.completed
              };
            }
            return set; // Return unchanged set
          })
        };
        console.log('✅ Updated exercise:', updatedExercise.exerciseName, 'sets:', updatedExercise.sets.map(s => s.completed));
        return updatedExercise;
      }
      return exercise; // Return unchanged exercise
    });
    
    console.log('🎯 New state:', newState.map(ex => ({ 
      name: ex.exerciseName, 
      sets: ex.sets.map(s => s.completed) 
    })));
    
    return newState;
  });
  
  // Animate timer when set is completed
  //timerScale.value = withSpring(1.1, {}, () => {
   // timerScale.value = withSpring(1);
  //});
};

  const handleExerciseNotesChange = (exerciseIndex: number, notes: string) => {
    setSessionExercises(prev => {
      const newExercises = [...prev];
      newExercises[exerciseIndex].exerciseNotes = notes;
      return newExercises;
    });
  };

  const handleCompleteWorkout = async () => {
    Alert.alert(
      'Complete Workout',
      'Are you sure you want to finish this workout session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
           onPress: async () => {
             setIsWorkoutRunning(false); 
    try {
      if (sessionId && user?.id) {
        // Prepare data for Firebase, filtering out undefined values
        const completedExercisesForFirebase = sessionExercises.map(ex => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: ex.sets.map((set: any) => ({
            reps: set.reps,
            ...(set.weight !== undefined && { weight: set.weight }), // Include weight only if defined
            completed: set.completed,
          })),
          ...(ex.exerciseNotes !== undefined && { notes: ex.exerciseNotes }), // Include notes only if defined
          duration: 0,
        }));

        await FirebaseService.updateWorkoutSession(user.id, sessionId, {
          endTime: new Date().toISOString(),
          totalTime: workoutTime,
          status: 'completed',
          completedExercises: completedExercisesForFirebase,
        });
                
                // Update plan's lastUsedAt
                await FirebaseService.updateWorkoutPlan(user.id, planId, {
                  lastUsedAt: new Date().toISOString()
                });
              }
              
              Alert.alert(
                'Workout Complete!',
                `Great job! You completed your workout in ${formatTime(workoutTime)}.`,
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/workout/my-plans') }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to save workout session');
            }
          }
        }
      ]
    );
  };

  const toggleWorkoutTimer = () => {
    setIsWorkoutRunning(!isWorkoutRunning);
  };

  const resetWorkoutTimer = () => {
    setWorkoutTime(0);
  };

  const timerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: timerScale.value }],
    };
  });

  // ADD THIS FUNCTION
  const handleExerciseNamePress = (exerciseId: string) => {
    router.push({
      pathname: '/(tabs)/workout/exercise-detail',
      params: {
        exerciseId: exerciseId,
        // Pass current planId for context if needed on detail page
        targetPlanId: planId
      }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    header: {
      backgroundColor: '#FFFFFF',
      padding: 17,
      paddingTop: 17,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center', 
      justifyContent: 'space-between',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
      flex: 1,
      marginHorizontal: 16,
    },
    timerContainer: {
      alignItems: 'center',
      paddingVertical: 10,
      backgroundColor: '#FFFFFF',
      marginBottom: 16,
    },
    timerDisplay: {
      fontSize: 48,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
    },
    timerControls: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 16,
    },
    timerButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timerButtonSecondary: {
      backgroundColor: '#6B7280',
    },
    exercisesScrollView: {
      flex: 1,
      paddingHorizontal: 24,
    },
    exercisesScrollViewContent: {
      paddingBottom: 120,
    },
    completeWorkoutButton: {
      position: 'absolute',
      bottom: 24,
      left: 24,
      right: 24,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    completeWorkoutGradient: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      gap: 8,
    },
    completeWorkoutText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
  });

  if (sessionExercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("calculator:loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          {isRTL ? (
            <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
          ) : (
            <ArrowLeft size={24} color="#111827" />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{planName}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Animated.Text style={[styles.timerDisplay, timerAnimatedStyle]}>
          {formatTime(workoutTime)}
        </Animated.Text>
      </View>

     {/* Exercises List */}
      <ScrollView 
        style={styles.exercisesScrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        removeClippedSubviews={false}
      >
        <View style={styles.exercisesScrollViewContent}>
          {sessionExercises.map((exercise, exerciseIndex) => {
            console.log(`🎯 Rendering card for exercise ${exerciseIndex}: ${exercise.exerciseName}`);
            
            return (
             <WorkoutExerciseCard
                key={`exercise-${exerciseIndex}`}  // Changed from exercise.exerciseId
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                onToggleSetCompletion={(exIndex, setIndex) => {
                  console.log(`🚀 Card ${exerciseIndex} called toggle:`, { exIndex, setIndex });
                  handleToggleSetCompletion(exIndex, setIndex);
                }}
                onNotesChange={handleExerciseNotesChange}
                disabled={false} // Sets are clickable in session
                onExerciseNamePress={handleExerciseNamePress} // ADD THIS LINE
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Complete Workout Button */}
      <TouchableOpacity 
        style={styles.completeWorkoutButton}
        onPress={handleCompleteWorkout}
      >
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={styles.completeWorkoutGradient}
        >
          <Check size={24} color="#FFFFFF" />
          <Text style={styles.completeWorkoutText}>{t("workoutScreen:completeWorkout")}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
