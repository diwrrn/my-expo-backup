import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { Droplet, Plus, Minus, LocationEdit as Edit3, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { Modal, TextInput, Alert } from 'react-native';
import { UserProfile } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';


interface WaterIntakeCardProps {
  currentWaterIntake: number;
  onUpdateWaterIntake: (glasses: number) => void;
  dailyGoal: number;
  onUpdateWaterGoal: (updates: { profile: Partial<UserProfile> }) => Promise<void>;
  onRefresh: () => void;
}

export function WaterIntakeCard({ currentWaterIntake, onUpdateWaterIntake, dailyGoal, onUpdateWaterGoal, onRefresh }: WaterIntakeCardProps) {
  const [waterIntake, setWaterIntake] = useState(currentWaterIntake);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempWaterGoal, setTempWaterGoal] = useState('');
  const { t, i18n } = useTranslation(); // Add i18n here
  const isKurdish = i18n.language === 'ku' || i18n.language === 'ckb'; // Check if Kurdish
  const isRTL = useRTL();
const { user } = useAuth();

  // Add logging for dailyGoal prop changes
  useEffect(() => {
    console.log('WaterIntakeCard: dailyGoal prop updated to:', dailyGoal);
  }, [dailyGoal]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    header: {
      marginBottom: 16,
    },
    titleContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      flex: 1,
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
          fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line
      textAlign: getTextAlign(isRTL),

    },
    actionButtons: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 8,
    },
    editButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
    },
    subtitle: {
      fontSize: 14,
      color: '#6B7280',
          fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

    },
    content: {
      alignItems: 'center',
    },
    progressContainer: {
      width: '100%',
      marginBottom: 20,
    },
    progressBackground: {
      height: 8,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#0891B2',
      borderRadius: 4,
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
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
      textAlign: getTextAlign(isRTL),
          fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

    },
    modalInput: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 24,
      textAlign: getTextAlign(isRTL),
          fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

    },
    modalActions: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'flex-end',
      gap: 12,
    },
    cancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6B7280',
    },
    saveButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: '#22C55E',
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
          fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

    },
    progressText: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: getTextAlign(isRTL),
          fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

    },
    controls: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F0F9FF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E0F2FE',
    },
    countContainer: {
      alignItems: 'center',
    },
    count: {
      fontSize: 32,
      fontWeight: '700',
      color: '#0891B2',
          fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

    },
    unit: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
          fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

    },
  }), [isKurdish, isRTL]);

  // Update local state when prop changes
  useEffect(() => {
    setWaterIntake(currentWaterIntake);
  }, [currentWaterIntake]);

  const handleIncrement = () => {
    const newValue = waterIntake + 1;
    setWaterIntake(newValue);
    onUpdateWaterIntake(newValue);
  };

  const handleDecrement = () => {
    if (waterIntake > 0) {
      const newValue = waterIntake - 1;
      setWaterIntake(newValue);
      onUpdateWaterIntake(newValue);
    }
  };

  const handleEditPress = () => {
    setTempWaterGoal(dailyGoal.toString());
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setTempWaterGoal('');
  };

  const handleSave = async () => {
    const newGoal = parseFloat(tempWaterGoal);
    
    // Add logging for save attempt
    console.log('WaterIntakeCard: Attempting to save newGoal:', newGoal);
    
    // Validate input
    if (isNaN(newGoal) || newGoal <= 0 || newGoal > 50) {
      Alert.alert(
        t('common:error'),
        t('homeScreen:invalidWaterGoal'),
        [{ text: t('common:ok') }]
      );
      return;
    }

    try {
      console.log('WaterIntakeCard: Calling onUpdateWaterGoal with:', { goalsWaterUpdate: newGoal });
      await onUpdateWaterGoal({
    
      
      
    goalsWaterUpdate: newGoal
  

      
    
  });
      
      Alert.alert(
        t('common:success'),
        t('homeScreen:waterGoalUpdated'),
        [{ text: t('common:ok') }]
      );
      
      setIsModalVisible(false);
      setTempWaterGoal('');
    } catch (error) {
      console.error('WaterIntakeCard: Error updating water goal:', error);
      Alert.alert(
        t('common:error'),
        t('waterIntakeCard:failedToUpdateWaterGoal'),
        [{ text: t('common:ok') }]
      );
    }
  };

  // Calculate progress percentage based on the dailyGoal prop
  const progressPercentage = Math.min((waterIntake / dailyGoal) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.titleContainer, { flexDirection: getFlexDirection(isRTL) }]}>
          <Droplet size={20} color="#0891B2" />
          <Text style={[styles.title, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
            {t('homeScreen:waterIntakeTitle')}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
              <Edit3 size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={onRefresh}>
              <RefreshCw size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.subtitle, { textAlign: getTextAlign(isRTL), marginLeft: isRTL ? 0 : 28, marginRight: isRTL ? 28 : 0 }]}>
          {t('homeScreen:trackHydration')}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {waterIntake} / {dailyGoal} {t('common:glasses')}
          </Text>
        </View>

        <View style={[styles.controls, { flexDirection: getFlexDirection(isRTL) }]}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleDecrement}
            disabled={waterIntake <= 0}
          >
            <Minus size={20} color={waterIntake <= 0 ? "#9CA3AF" : "#0891B2"} />
          </TouchableOpacity>
          
          <View style={styles.countContainer}>
            <Text style={styles.count}>{waterIntake}</Text>
            <Text style={styles.unit}>{t('foodDetailsScreen:glasses')}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleIncrement}
          >
            <Plus size={20} color="#0891B2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Water Goal Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('homeScreen:editWaterGoal')}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={tempWaterGoal}
              onChangeText={setTempWaterGoal}
              placeholder={t('homeScreen:enterWaterGoal')}
              keyboardType="numeric"
              autoFocus={true}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>
                  {t('common:cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {t('common:save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}