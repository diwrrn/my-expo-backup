import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Calendar, Dumbbell, Trash2, Edit3, Target, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useWorkoutPlansCache } from '@/hooks/useWorkoutPlansCache';
import { useAppStore } from '@/store/appStore';

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
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const user = useAppStore(state => state.user);
  
  // Use the cached hook instead of direct Firebase calls
  const { plans, isLoading, error, deletePlan, refreshPlans } = useWorkoutPlansCache(user?.id || '');

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
              await deletePlan(planId);
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

  const getTotalSets = (plan: WorkoutPlan) => {
    return plan.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAFAFA',
    },

    // Header Styles
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    headerTop: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1F2937',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 28,
    },
    headerStats: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginTop: 4,
    },
    planCount: {
      fontSize: 15,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Content Styles
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 100,
    },

    // Loading & Error States
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      minHeight: 300,
    },
    loadingText: {
      fontSize: 16,
      color: '#6B7280',
      marginTop: 16,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 24,
    },

    // Empty State
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      minHeight: 400,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 8,
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    createFirstPlanButton: {
      backgroundColor: '#22C55E',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 8,
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    createFirstPlanText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Plans List
    plansList: {
      padding: 16,
    },
    planCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
    },
    planCardContent: {
      padding: 20,
    },
    planHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    planMainInfo: {
      flex: 1,
      paddingRight: isRTL ? 0 : 16,
      paddingLeft: isRTL ? 16 : 0,
    },
    planName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 22,
    },
    planMetaRow: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16,
    },
    metaItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    lastUsedText: {
      fontSize: 13,
      color: '#9CA3AF',
      marginTop: 4,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Action Buttons
    planActions: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    editButton: {
      backgroundColor: '#EFF6FF',
      borderColor: '#DBEAFE',
    },
    deleteButton: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
    },

    // Quick Stats Bar
    quickStats: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      gap: 20,
    },
    quickStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    quickStatValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 2,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    quickStatLabel: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Floating Action Button
    fab: {
      position: 'absolute',
      bottom: 100,
      right: isRTL ? undefined : 20,
      left: isRTL ? 20 : undefined,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            {isRTL ? (
              <ArrowLeft size={20} color="#374151" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={20} color="#374151" />
            )}
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('workoutScreen:myWorkoutPlans')}</Text>
          </View>
        </View>
        
        <View style={styles.headerStats}>
          <Text style={styles.planCount}>
            {plans.length} {plans.length === 1 ? t('common:plan') : t('common:plans')}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>{t('common:loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>
              {t('common:errorLoadingPlans')}
            </Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Dumbbell size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>{t("workoutScreen:noWorkoutPlansYet")}</Text>
            <Text style={styles.emptyText}>
              {t("workoutScreen:createYour")}
            </Text>
            <TouchableOpacity 
              style={styles.createFirstPlanButton}
              onPress={() => router.push('/(tabs)/workout/create-plan-name')}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createFirstPlanText}>{t("workoutScreen:createYourFirstPlan")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plansList}>
{plans.map((plan) => {
  // Add debugging
  console.log('🔍 Plan:', plan.name, 'Exercises:', plan.exercises);
  console.log('🔍 Exercises length:', plan.exercises?.length);
  console.log('�� Exercises array:', JSON.stringify(plan.exercises, null, 2));

  return (
    <TouchableOpacity
      key={plan.id}
      style={styles.planCard}
      onPress={() => handlePlanPress(plan.id)}
      activeOpacity={0.8}
    >
      <View style={styles.planCardContent}>
        <View style={styles.planHeader}>
          <View style={styles.planMainInfo}>
            <Text style={styles.planName} numberOfLines={2}>
              {plan.name}
            </Text>
            
            <View style={styles.planMetaRow}>
              <View style={styles.metaItem}>
                <Dumbbell size={16} color="#22C55E" />
                <Text style={styles.metaText}>
                  {plan.exercises?.length || 0} exercises
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Target size={16} color="#6B7280" />
                <Text style={styles.metaText}>
                  {getTotalSets(plan)} sets
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.metaText}>
                  {formatDate(plan.createdAt)}
                </Text>
              </View>
            </View>
            
            {plan.lastUsedAt && (
              <Text style={styles.lastUsedText}>
                Last used {formatDate(plan.lastUsedAt)}
              </Text>
            )}
          </View>
          
          <View style={styles.planActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => router.push({
                pathname: '/(tabs)/workout/create-plan',
                params: { editPlanId: plan.id }
              })}
              activeOpacity={0.7}
            >
              <Edit3 size={18} color="#3B82F6" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeletePlan(plan.id, plan.name)}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{plan.exercises?.length || 0}</Text>
            <Text style={styles.quickStatLabel}>Exercises</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{getTotalSets(plan)}</Text>
            <Text style={styles.quickStatLabel}>Total Sets</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>
              {Math.round(getTotalSets(plan) * 2.5)}
            </Text>
            <Text style={styles.quickStatLabel}>Est. Min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
})}

          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {plans.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/(tabs)/workout/create-plan-name')}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}