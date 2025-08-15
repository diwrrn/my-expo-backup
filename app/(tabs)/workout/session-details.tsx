import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Calendar, Dumbbell } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { FirebaseService, WorkoutSession } from '@/services/firebaseService';
import { WorkoutExerciseCard } from '@/components/WorkoutExerciseCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/store/appStore';

export default function SessionDetailsScreen() {
  const { sessionId, planName, planId } = useLocalSearchParams<{ 
    sessionId: string; 
    planName: string; 
    planId: string; 
  }>();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const user = useAppStore(state => state.user);

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && sessionId) {
      loadSessionDetails();
    }
  }, [user?.id, sessionId]);

  const loadSessionDetails = async () => {
    if (!user?.id || !sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedSession = await FirebaseService.getWorkoutSessionById(user.id, sessionId);
      setSession(fetchedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const formatSessionDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const dayOfWeek = date.toLocaleDateString(i18n.language, { weekday: 'long' });
    return `${day}/${month}/${year} ${dayOfWeek}`;
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
    },
    headerGradient: {
      paddingBottom: 20,
    },
    header: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'flex-start',
      padding: 24,
      paddingTop: 60,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    headerMeta: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    metaText: {
      fontSize: 14,
      color: '#6B7280',
      marginLeft: isRTL ? 0 : 4,
      marginRight: isRTL ? 4 : 0,
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 90,
    },
    timerCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginHorizontal: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    timerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#6B7280',
      marginBottom: 8,
    },
    timerDisplay: {
      fontSize: 48,
      fontWeight: '700',
      color: '#22C55E',
      marginBottom: 8,
    },
    timerSubtext: {
      fontSize: 14,
      color: '#9CA3AF',
    },
    statsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: 'center',
    },
    exercisesSection: {
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
      textAlign: getTextAlign(isRTL),
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Session not found'}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalSets = session.completedExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = session.completedExercises.reduce(
    (sum, ex) => sum + ex.sets.filter(set => set.completed).length, 
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F0FDF4', '#F9FAFB']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            {isRTL ? (
              <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={24} color="#111827" />
            )}
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{planName}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.metaItem}>
                <Calendar size={14} color="#6B7280" />
                <Text style={styles.metaText}>
                  {formatSessionDate(session.startTime)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Dumbbell size={14} color="#6B7280" />
                <Text style={styles.metaText}>
                  {session.completedExercises.length} {t("workoutScreen:exercises")}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          {/* Timer Display */}
          <View style={styles.timerCard}>
            <Text style={styles.timerTitle}>{t("workoutScreen:totalWorkoutTime")}</Text>
            <Text style={styles.timerDisplay}>
              {formatTime(session.totalTime)}
            </Text>
            <Text style={styles.timerSubtext}>
              {t("workoutScreen:completedOn")} {formatSessionDate(session.startTime)}
            </Text>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{session.completedExercises.length}</Text>
              <Text style={styles.statLabel}>{t("workoutScreen:exercises")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedSets}/{totalSets}</Text>
              <Text style={styles.statLabel}>{t("workoutScreen:setsCompleted")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(session.totalTime / 60)}</Text>
              <Text style={styles.statLabel}>{t("workoutScreen:minutes")}</Text>
            </View>
          </View>

          {/* Exercises List */}
          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>{t("workoutScreen:exercisesCompleted")}</Text>
            
            {session.completedExercises.map((exercise, index) => (
              <WorkoutExerciseCard
                key={exercise.exerciseId}
                exercise={{
                  ...exercise,
                  exerciseNotes: exercise.notes || '',
                }}
                exerciseIndex={index}
                disabled={true} // Make everything unclickable
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}