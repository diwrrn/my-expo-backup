import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, LocationEdit as Edit2, Trash2, UtensilsCrossed, Calendar } from 'lucide-react-native';
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
        origin: 'saved-plans' // NEW: Indicate origin
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderDateGroup = (date: string, plans: SavedMealPlan[]) => (
    <View key={date} style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Calendar size={18} color="#6B7280" />
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </View>
      
      {plans.map(plan => (
        <View key={plan.id} style={styles.planCard}>
          <TouchableOpacity 
            style={styles.planCardContent}
            onPress={() => handleViewPlan(plan)}
            activeOpacity={0.7}
          >
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planStats}>
                {plan.mealPlanData.totalCalories} kcal • {plan.mealPlanData.totalProtein}g protein
              </Text>
            </View>
            
            <View style={styles.planActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleEditPlan(plan)}
              >
                <Edit2 size={18} color="#3B82F6" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeletePlan(plan)}
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Saved Meal Plans</Text>
          <Text style={styles.headerSubtitle}>View and manage your saved meal plans</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading saved meal plans...</Text>
        </View>
      ) : Object.keys(groupedPlans).length === 0 ? (
        <View style={styles.emptyContainer}>
          <UtensilsCrossed size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Saved Meal Plans</Text>
          <Text style={styles.emptyText}>
            Generate and save meal plans to see them here
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/(tabs)/meal-planner')}
          >
            <Text style={styles.createButtonText}>Create Meal Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scrollViewContent}>
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
                <Text style={styles.modalSaveText}>Save</Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 24,
    paddingBottom: 90, // Space for footer navigation
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  planCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  planStats: {
    fontSize: 14,
    color: '#6B7280',
  },
  planActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});