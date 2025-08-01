import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Calendar, Dumbbell, Trash2, LocationEdit as Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  FadeInDown,
  FadeOutRight
} from 'react-native-reanimated';

interface WorkoutPlan {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    order: number;
  }>;
}

export default function MyWorkoutPlansScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { user } = useAuth();
  
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadWorkoutPlans();
    }
  }, [user?.id]);

  const loadWorkoutPlans = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const plans = await FirebaseService.getWorkoutPlans(user.id);
      setWorkoutPlans(plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    Alert.alert(
      'Delete Workout Plan',
      `Are you sure you want to delete "${planName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteWorkoutPlan(user!.id, planId);
              setWorkoutPlans(prev => prev.filter(plan => plan.id !== planId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout plan');
            }
          }
        }
      ]
    );
  };

  const handlePlanPress = (planId: string) => {
    router.push({
      pathname: '/(tabs)/workout/plan-details',
      params: { planId }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
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
      padding: 24,
      paddingTop: 60,
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
    createFirstPlanButton: {
      backgroundColor: '#22C55E',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    createFirstPlanText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    plansList: {
      padding: 24,
    },
    planCard: {
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
    planHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    planInfo: {
      flex: 1,
    },
    planName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    planStats: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 4,
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
    lastUsed: {
      fontSize: 12,
      color: '#9CA3AF',
      textAlign: getTextAlign(isRTL),
    },
    planActions: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    deleteButton: {
      backgroundColor: '#FEF2F2',
    },
    fab: {
      position: 'absolute',
      bottom: 100,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });

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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('workoutScreen:myWorkoutPlans')}</Text>
          <Text style={styles.headerSubtitle}>{t('workoutScreen:manage')}</Text>
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
          ) : workoutPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Dumbbell size={48} color="#D1D5DB" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>{t("workoutScreen:noWorkoutPlansYet")}</Text>
              <Text style={styles.emptyText}>
                {t("workoutScreen:createYour")}
              </Text>
              <TouchableOpacity 
                style={styles.createFirstPlanButton}
                onPress={() => router.push('/(tabs)/workout/create-plan-name')}
              >
                <Text style={styles.createFirstPlanText}>{t("workoutScreen:createYourFirstPlan")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.plansList}>
              {workoutPlans.map((plan, index) => (
                <Animated.View
                  key={plan.id}
                  entering={FadeInDown.delay(index * 100)}
                  exiting={FadeOutRight}
                >
                  <TouchableOpacity 
                    style={styles.planCard}
                    onPress={() => handlePlanPress(plan.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.planHeader}>
                      <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View style={styles.planStats}>
                          <View style={styles.statItem}>
                            <Dumbbell size={14} color="#6B7280" />
                            <Text style={styles.statText}>
                              {plan.exercises.length} {t("workoutScreen:exercises")}
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <Calendar size={14} color="#6B7280" />
                            <Text style={styles.statText}>
                              {t("workoutScreen:created")} {formatDate(plan.createdAt)}
                            </Text>
                          </View>
                        </View>
                        {plan.lastUsedAt && (
                          <Text style={styles.lastUsed}>
                            {t("workoutScreen:lastUsed")} {formatDate(plan.lastUsedAt)}
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.planActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => router.push({
                            pathname: '/(tabs)/workout/create-plan',
                            params: { editPlanId: plan.id }
                          })}
                        >
                          <Edit3 size={16} color="#6B7280" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeletePlan(plan.id, plan.name)}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {workoutPlans.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/(tabs)/workout/create-plan-name')}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}