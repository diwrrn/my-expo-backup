import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, LocationEdit as Edit3, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { MicroNutrientGoals } from '@/types/api';
import { LinearGradient } from 'expo-linear-gradient';
import { DailyGoalsSkeleton } from '@/components/DailyGoalsSkeleton';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

interface ProgressBarProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  onEdit: () => void;
  onRemove?: () => void;
  isRemovable?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  current,
  goal,
  unit,
  color,
  onEdit,
  onRemove,
  isRemovable = false
}) => {
  const { t } = useTranslation();
  const isRTL = useRTL();
  
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOverGoal = current > goal && goal > 0;
  

  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarHeader, { flexDirection: getFlexDirection(isRTL) }]}>
        <Text style={[styles.progressBarLabel, { textAlign: getTextAlign(isRTL) }]}>
          {label}
        </Text>
        <View style={[styles.progressBarActions, { flexDirection: getFlexDirection(isRTL) }]}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Edit3 size={16} color="#6B7280" />
          </TouchableOpacity>
          {isRemovable && onRemove && (
            <TouchableOpacity style={styles.actionButton} onPress={onRemove}>
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={[styles.progressBarValues, { flexDirection: getFlexDirection(isRTL) }]}>
        <Text style={[
          styles.currentValue,
          isOverGoal && styles.overGoalValue,
          { textAlign: getTextAlign(isRTL) }
        ]}>
          {current.toFixed(1)}{unit}
        </Text>
        <Text style={[styles.goalValue, { textAlign: getTextAlign(isRTL),   marginLeft: isRTL ? 0 : 7, marginRight: isRTL ? 7 : 0, }]}>
          {isOverGoal ? t('common:overGoal') : t('common:ofGoal')} {goal}{unit}
        </Text>
      </View>
      
      <View style={styles.progressBarTrack}>
        <View 
          style={[
            styles.progressBarFill,
            { 
              width: `${percentage}%`,
              backgroundColor: isOverGoal ? '#EF4444' : color
            }
          ]} 
        />
      </View>
      
      <Text style={[
        styles.progressPercentage,
        isOverGoal && styles.overGoalPercentage,
        { textAlign: getTextAlign(isRTL) }
      ]}>
        {percentage.toFixed(0)}%
      </Text>
    </View>
  );
};


export default function DailyGoalsScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { user, profileCache } = useAuth();
  const { getUserProfile, updateUserProfile, dailyTotals, dailyMealsCache } = useFirebaseData();
  
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65,
  });
  
  const [microGoals, setMicroGoals] = useState<MicroNutrientGoals>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNutrient, setEditingNutrient] = useState<string>('');
  const [editValue, setEditValue] = useState(''); 

  // Default micronutrient values based on gender
  const getDefaultMicroGoals = (gender: 'male' | 'female' = 'male') => {
    const defaults = {
      male: {
        fiber: 38,
        vitaminD: 600,
        calcium: 1000,
        iron: 8,
        sodium: 2300,
        potassium: 3400,
        sugar: 36
      },
      female: {
        fiber: 25,
        vitaminD: 600,
        calcium: 1000,
        iron: 18,
        sodium: 2300,
        potassium: 2600,
        sugar: 25
      }
    };
    return defaults[gender];
  };

  const availableMicroNutrients = [
    { key: 'fiber', label: t('common:fiber'), unit: 'g', color: '#8B5CF6' },
    { key: 'vitaminD', label: t('common:vitd'), unit: 'IU', color: '#F59E0B' },
    { key: 'calcium', label: t('common:calcium'), unit: 'mg', color: '#06B6D4' },
    { key: 'iron', label: t('common:iron'), unit: 'mg', color: '#EF4444' },
    { key: 'sodium', label: t('common:sodium'), unit: 'mg', color: '#F97316' },
    { key: 'potassium', label: t('common:potassium'), unit: 'mg', color: '#10B981' },
    { key: 'sugar', label: t('common:sugar'), unit: 'g', color: '#EC4899' },
  ];

  // Load user profile and goals
  useEffect(() => {
    if (user?.profile) {
      setGoals(user.profile.goals);
      setMicroGoals(user.profile.microNutrientGoals || {});
    }
  }, [user?.profile]);

  const handleAddMicroNutrient = (nutrientKey: string) => {
    const defaults = getDefaultMicroGoals(); // Default to male for now
    const defaultValue = defaults[nutrientKey as keyof typeof defaults];
    
    const updatedMicroGoals = {
      ...microGoals,
      [nutrientKey]: defaultValue
    };
    
    setMicroGoals(updatedMicroGoals);
    saveMicroGoals(updatedMicroGoals);
    setShowAddModal(false);
  };

  const handleRemoveMicroNutrient = (nutrientKey: string) => {
    Alert.alert(
      'Remove Nutrient',
      `Are you sure you want to remove ${availableMicroNutrients.find(n => n.key === nutrientKey)?.label} from your goals?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedMicroGoals = { ...microGoals };
            delete updatedMicroGoals[nutrientKey as keyof MicroNutrientGoals];
            setMicroGoals(updatedMicroGoals);
            saveMicroGoals(updatedMicroGoals);
          }
        }
      ]
    );
  };

  const handleEditNutrient = (nutrientKey: string, currentValue: number) => {
    setEditingNutrient(nutrientKey);
    setEditValue(currentValue.toString());
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      Alert.alert('Error', 'Please enter a valid positive number');
      return;
    }

    if (editingNutrient === 'calories' || editingNutrient === 'protein' || 
        editingNutrient === 'carbs' || editingNutrient === 'fat') {
      // Update main goals
      const updatedGoals = {
        ...goals,
        [editingNutrient]: value
      };
      setGoals(updatedGoals);
      saveMainGoals(updatedGoals);
    } else {
      // Update micronutrient goals
      const updatedMicroGoals = {
        ...microGoals,
        [editingNutrient]: value
      };
      setMicroGoals(updatedMicroGoals);
      saveMicroGoals(updatedMicroGoals);
    }

    setShowEditModal(false);
    setEditingNutrient('');
    setEditValue('');
  };

  const saveMainGoals = async (updatedGoals: typeof goals) => {
    try {
      await updateUserProfile({ goals: updatedGoals });
    } catch (error) {
      console.error('Error saving main goals:', error);
      Alert.alert('Error', 'Failed to save goals');
    }
  };

  const saveMicroGoals = async (updatedMicroGoals: MicroNutrientGoals) => {
    try {
      await updateUserProfile({ microNutrientGoals: updatedMicroGoals });
    } catch (error) {
      console.error('Error saving micro goals:', error);
      Alert.alert('Error', 'Failed to save micronutrient goals');
    }
  };

  // Get current values (mock data for now - would come from daily totals)
  const getCurrentValues = () => ({
    calories: dailyTotals.calories || 0,
    protein: dailyTotals.protein || 0,
    carbs: dailyTotals.carbs || 0,
    fat: dailyTotals.fat || 0,
    fiber: dailyTotals.fiber || 0,
    vitaminD: dailyTotals.vitaminD || 0,
    calcium: dailyTotals.calcium || 0,
    iron: dailyTotals.iron || 0,
    sodium: dailyTotals.sodium || 0,
    potassium: dailyTotals.potassium || 0,
    sugar: dailyTotals.sugar || 0,
  });

  const currentValues = getCurrentValues();

  const mainNutrients = [
    { key: 'calories', label: t('common:calories'), unit: ' kcal', color: '#22C55E' },
    { key: 'protein', label: t('common:protein'), unit: 'g', color: '#3B82F6' },
    { key: 'carbs', label:t('common:carb'), unit: 'g', color: '#F59E0B' },
    { key: 'fat', label: t('common:fat'), unit: 'g', color: '#EF4444' },
  ];

  // Show skeleton while profile data is loading
  // Check all loading states to prevent flickering
  if (profileCache.isLoading || dailyMealsCache.isLoading || !user?.profile) {
    return (
      <SafeAreaView style={styles.container}>
        <DailyGoalsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
        {/* Header */}
        <LinearGradient
          colors={['#F0FDF4', '#F9FAFB']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              {isRTL ? <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} /> : <ArrowLeft size={24} color="#111827" />}
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { textAlign: getTextAlign(isRTL) }]}>
                {t('dailyGoalsScreen:headerTitle')}
              </Text>
              <Text style={[styles.headerSubtitle, { textAlign: getTextAlign(isRTL) }]}>
                {t('dailyGoalsScreen:headerSubtitle')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main Nutrients */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
            {t('dailyGoalsScreen:mainNutrients')}
          </Text>
          {mainNutrients.map((nutrient) => (
            <ProgressBar
              key={nutrient.key}
              label={nutrient.label}
              current={currentValues[nutrient.key as keyof typeof currentValues]}
              goal={goals[nutrient.key as keyof typeof goals]}
              unit={nutrient.unit}
              color={nutrient.color}
              onEdit={() => handleEditNutrient(nutrient.key, goals[nutrient.key as keyof typeof goals])}
              isRemovable={false}
            />
          ))}
        </View>

        {/* Micronutrients */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, {flexDirection: getFlexDirection(isRTL)}]}>
            <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
              {t('dailyGoalsScreen:micronutrients')}
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#22C55E" />
              <Text style={styles.addButtonText}>{t('dailyGoalsScreen:addMore')}</Text>
            </TouchableOpacity>
          </View>

          {Object.entries(microGoals).map(([key, value]) => {
            const nutrient = availableMicroNutrients.find(n => n.key === key);
            if (!nutrient) return null;

            return (
              <ProgressBar
                key={key}
                label={nutrient.label}
                current={currentValues[key as keyof typeof currentValues] || 0}
                goal={value || 0}
                unit={nutrient.unit}
                color={nutrient.color}
                onEdit={() => handleEditNutrient(key, value || 0)}
                onRemove={() => handleRemoveMicroNutrient(key)}
                isRemovable={true}
              />
            );
          })}

          {Object.keys(microGoals).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { textAlign: getTextAlign(isRTL) }]}>
                {t('dailyGoalsScreen:noMicronutrients')}
              </Text>
              <Text style={[styles.emptyStateSubtext, { textAlign: getTextAlign(isRTL) }]}>
                {t('common:tapAddMore')}
              </Text>
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      {/* Add Micronutrient Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { textAlign: getTextAlign(isRTL) }]}>
              {t('dailyGoalsScreen:addMicronutrientModalTitle')}
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {availableMicroNutrients
              .filter(nutrient => !microGoals[nutrient.key as keyof MicroNutrientGoals])
              .map((nutrient) => (
                <TouchableOpacity
                  key={nutrient.key}
                  style={styles.nutrientOption}
                  onPress={() => handleAddMicroNutrient(nutrient.key)}
                >
                  <View style={[styles.nutrientIndicator, { backgroundColor: nutrient.color, marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }]} />
                  <View style={styles.nutrientInfo}>
                    <Text style={[styles.nutrientName, { textAlign: getTextAlign(isRTL) }]}>{nutrient.label}</Text>
                    <Text style={[styles.nutrientUnit, { textAlign: getTextAlign(isRTL) }]}>
                      {t('common:measuredIn')} {nutrient.unit}
                    </Text>
                  </View>
                  <Plus size={20} color="#22C55E" />
                </TouchableOpacity>
              ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={showEditModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={[styles.editModalTitle, { textAlign: getTextAlign(isRTL) }]}>
              {t('dailyGoalsScreen:editGoalModalTitle', {
                nutrient: availableMicroNutrients.find(n => n.key === editingNutrient)?.label || 
                         mainNutrients.find(n => n.key === editingNutrient)?.label
              })}
            </Text>
            
            <TextInput 
              style={[styles.editInput, { textAlign: getTextAlign(isRTL) }]}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              placeholder={t('dailyGoalsScreen:enterGoalValue')}
              autoFocus
            />
            
            <View style={[styles.editModalActions, { flexDirection: getFlexDirection(isRTL) }]}>
              <TouchableOpacity 
                style={styles.editCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.editCancelText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.editSaveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.editSaveText}>{t('common:save')}</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 90, // Space for footer navigation
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection:'row',
    alignItems: 'center',
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
    marginRight: 43,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection:'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    flexDirection:'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 4,
  },
  progressBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressBarHeader: {
    flexDirection:'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressBarActions: {
    flexDirection:'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
  },
  progressBarValues: {
    flexDirection:'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  overGoalValue: {
    color: '#EF4444',
  },
  goalValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 5,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'right',
  },
  overGoalPercentage: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  nutrientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nutrientIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  nutrientUnit: {
    fontSize: 14,
    color: '#6B7280',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  editModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  editModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});