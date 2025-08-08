import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, Edit3, Trash2, UtensilsCrossed, Calendar, Clock, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';
import { SavedMealPlan } from '@/types/api';
import { formatDateToString } from '@/utils/dateUtils';

export default function SavedMealPlansScreen() {
  const { user } = useAuth();
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedPlans, setGroupedPlans] = useState<{[date: string]: SavedMealPlan[]}>({});
  const [editingPlan, setEditingPlan] = useState<SavedMealPlan | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadSavedPlans();
  }, [user]);

  const loadSavedPlans = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log(`[SavedPlans] Attempting to load meal plans for user ID: ${user.id}`);
      
      const plans = await FirebaseService.getSavedMealPlans(user.id);
      
      console.log(`[SavedPlans] Loaded ${plans.length} meal plans for user ID: ${user.id}. First plan ID: ${plans.length > 0 ? plans[0].id : 'N/A'}`);
      
      setSavedPlans(plans);
      
      // Group plans by date
      const grouped = plans.reduce((acc, plan) => {
        const date = plan.generatedAt.split('T')[0]; // Extract YYYY-MM-DD
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(plan);
        return acc;
      }, {} as {[date: string]: SavedMealPlan[]});
      
      setGroupedPlans(grouped);
    } catch (error) {
      console.error('Error loading saved meal plans:', error);
      Alert.alert('Error', 'Failed to load saved meal plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (plan: SavedMealPlan) => {
    setEditingPlan(plan);
    setNewPlanName(plan.name);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPlan || !newPlanName.trim()) return;
    
    try {
      await FirebaseService.updateSavedMealPlanName(editingPlan.id, newPlanName.trim());
      
      // Update local state
      setSavedPlans(prev => 
        prev.map(plan => 
          plan.id === editingPlan.id ? { ...plan, name: newPlanName.trim() } : plan
        )
      );
      
      // Update grouped plans
      const date = editingPlan.generatedAt.split('T')[0];
      setGroupedPlans(prev => ({
        ...prev,
        [date]: prev[date].map(plan => 
          plan.id === editingPlan.id ? { ...plan, name: newPlanName.trim() } : plan
        )
      }));
      
      setShowEditModal(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('Error updating meal plan name:', error);
      Alert.alert('Error', 'Failed to update meal plan name');
    }
  };

  const handleDeletePlan = (plan: SavedMealPlan) => {
    Alert.alert(
      'Delete Meal Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteSavedMealPlan(plan.id);
              
              // Update local state
              setSavedPlans(prev => prev.filter(p => p.id !== plan.id));
              
              // Update grouped plans
              const date = plan.generatedAt.split('T')[0];
              setGroupedPlans(prev => {
                const newGrouped = { ...prev };
                newGrouped[date] = newGrouped[date].filter(p => p.id !== plan.id);
                
                // Remove date key if no plans left for that date
                if (newGrouped[date].length === 0) {
                  delete newGrouped[date];
                }
                
                return newGrouped;
              });
            } catch (error) {
              console.error('Error deleting meal plan:', error);
              Alert.alert('Error', 'Failed to delete meal plan');
            }
          }
        }
      ]
    );
  };

  const handleViewPlan = (plan: SavedMealPlan) => {
    console.log('Navigating to meal plan details with planId:', plan.id);

    router.push({
      pathname: '/(tabs)/meal-plan-details',
      params: {
        planId: plan.id,
        origin: 'saved-plans'
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderDateGroup = (date: string, plans: SavedMealPlan[]) => (
    <View key={date} style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <View style={styles.dateIconContainer}>
          <Calendar size={16} color="#10B981" />
        </View>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
        <View style={styles.planCount}>
          <Text style={styles.planCountText}>{plans.length} plan{plans.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      
      <View style={styles.plansContainer}>
        {plans.map(plan => (
          <TouchableOpacity 
            key={plan.id}
            style={styles.planCard}
            onPress={() => handleViewPlan(plan)}
            activeOpacity={0.7}
          >
            <View style={styles.planCardHeader}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planMeta}>
                  <Clock size={12} color="#9CA3AF" />
                  <Text style={styles.planTime}>{formatTime(plan.generatedAt)}</Text>
                </View>
              </View>
              
              <View style={styles.planActions}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditPlan(plan);
                  }}
                >
                  <Edit3 size={16} color="#64748B" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePlan(plan);
                  }}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.planStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{plan.mealPlanData.totalCalories}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{plan.mealPlanData.totalProtein}g</Text>
                <Text style={styles.statLabel}>Protein</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{plan.mealPlanData.totalCarbs}g</Text>
                <Text style={styles.statLabel}>Carbs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{plan.mealPlanData.totalFat}g</Text>
                <Text style={styles.statLabel}>Fat</Text>
              </View>
            </View>
            
            
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#64748B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Saved Meal Plans</Text>
          <Text style={styles.headerSubtitle}>Your collection of personalized nutrition plans</Text>
        </View>
        <View style={styles.headerIcon}>
          <UtensilsCrossed size={20} color="#10B981" />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <TrendingUp size={48} color="#10B981" />
            <Text style={styles.loadingText}>Loading your meal plans...</Text>
            <Text style={styles.loadingSubtext}>Gathering your nutrition history</Text>
          </View>
        </View>
      ) : Object.keys(groupedPlans).length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <UtensilsCrossed size={64} color="#E5E7EB" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Meal Plans</Text>
            <Text style={styles.emptyText}>
              Create your first AI-powered meal plan to start building your nutrition library
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/meal-planner')}
            >
              <UtensilsCrossed size={18} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Meal Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scrollViewContent}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Your Collection</Text>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeText}>{savedPlans.length} plans</Text>
                </View>
              </View>
              <Text style={styles.summaryText}>
                You have saved {savedPlans.length} meal plan{savedPlans.length !== 1 ? 's' : ''} across {Object.keys(groupedPlans).length} day{Object.keys(groupedPlans).length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Render plans grouped by date */}
            {Object.entries(groupedPlans)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
              .map(([date, plans]) => renderDateGroup(date, plans))}
          </View>
        </ScrollView>
      )}

      {/* Edit Plan Name Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Meal Plan Name</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newPlanName}
              onChangeText={setNewPlanName}
              placeholder="Enter meal plan name"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  summaryText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  
  // Date Groups
  dateGroup: {
    marginBottom: 32,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  planCount: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  plansContainer: {
    gap: 12,
  },
  
  // Plan Cards
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  planActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  planFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    padding: 16,
    paddingTop: 12,
  },
  mealTypes: {
    flexDirection: 'row',
    gap: 6,
  },
  mealTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});