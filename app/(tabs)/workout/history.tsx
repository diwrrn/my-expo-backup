import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, Dumbbell } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService, WorkoutSession } from '@/services/firebaseService';

export default function WorkoutHistoryScreen() {
  const { planId, planName } = useLocalSearchParams<{ planId: string; planName: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && planId) {
      loadWorkoutSessions();
    }
  }, [user?.id, planId]);

  const loadWorkoutSessions = async () => {
    if (!user?.id || !planId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedSessions = await FirebaseService.getWorkoutSessionsByPlanId(user.id, planId);
      setSessions(fetchedSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout sessions');
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

  const handleSessionPress = (sessionId: string) => {
    router.push({
      pathname: '/(tabs)/workout/session-details',
      params: { sessionId, planName, planId }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 90,
    },
    header: {
      backgroundColor: '#FFFFFF',
      padding: 16,
      paddingTop: 24,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'flex-start',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
      padding: 24,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 300,
      padding: 24,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 24,
    },
    sessionsList: {
      padding: 24,
    },
    sessionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    sessionCardHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sessionDate: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    sessionTime: {
      fontSize: 16,
      fontWeight: '600',
      color: '#22C55E',
    },
    sessionStats: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    statItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    statText: {
      fontSize: 14,
      color: '#6B7280',
      marginLeft: isRTL ? 0 : 4,
      marginRight: isRTL ? 4 : 0,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          {isRTL ? (
            <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
          ) : (
            <ArrowLeft size={24} color="#111827" />
          )}
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Workout History</Text>
          <Text style={styles.headerSubtitle}>{planName}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('common:error')}: {error}</Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color="#D1D5DB" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Workout Sessions</Text>
              <Text style={styles.emptyText}>
                Complete your first workout session to see your history here
              </Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => handleSessionPress(session.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionCardHeader}>
                    <Text style={styles.sessionDate}>
                      {formatSessionDate(session.startTime)}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {formatTime(session.totalTime)}
                    </Text>
                  </View>
                  
                  <View style={styles.sessionStats}>
                    <View style={styles.statItem}>
                      <Dumbbell size={14} color="#6B7280" />
                      <Text style={styles.statText}>
                        {session.completedExercises.length} exercises
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.statText}>
                        {formatTime(session.totalTime)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}