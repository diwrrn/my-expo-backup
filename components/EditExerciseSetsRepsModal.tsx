import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

interface EditExerciseSetsRepsModalProps {
  isVisible: boolean;
  onClose: () => void;
  exercise: {
    id: string;
    name: string;
    nameKurdish?: string;
    nameArabic?: string;
    sets: number;
    reps: Array<{ reps: number; weight?: number }>;
    notes?: string;
  };
  onUpdate: (updatedExerciseData: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: Array<{
      reps: number;
      weight?: number;
    }>;
    notes?: string;
  }) => void;
}

export function EditExerciseSetsRepsModal({
  isVisible,
  onClose,
  exercise,
  onUpdate,
}: EditExerciseSetsRepsModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();

  const [sets, setSets] = useState(exercise.sets);
  const [repsPerSet, setRepsPerSet] = useState<Array<{ reps: number; weight?: number }>>(
    exercise.reps.map(s => ({ reps: s.reps, weight: s.weight }))
  );
  const [notes, setNotes] = useState(exercise.notes || '');

  useEffect(() => {
    // Reset form when modal opens or exercise changes
    if (isVisible && exercise) {
      setSets(exercise.sets);
      setRepsPerSet(exercise.reps.map(s => ({ reps: s.reps, weight: s.weight })));
      setNotes(exercise.notes || '');
    }
  }, [isVisible, exercise]);

  const getLocalizedExerciseName = () => {
    if (i18n.language === 'ku' && exercise.nameKurdish) return exercise.nameKurdish;
    if (i18n.language === 'ar' && exercise.nameArabic) return exercise.nameArabic;
    return exercise.name;
  };

  const updateSetsCount = (newSets: number) => {
    if (newSets < 1) return;
    const currentSetsData = [...repsPerSet];
    if (newSets > currentSetsData.length) {
      for (let i = currentSetsData.length; i < newSets; i++) {
        currentSetsData.push({ reps: 10, weight: undefined });
      }
    } else if (newSets < currentSetsData.length) {
      currentSetsData.splice(newSets);
    }
    setSets(newSets);
    setRepsPerSet(currentSetsData);
  };

  const updateRepsForSet = (index: number, reps: number) => {
    const updatedSetsData = [...repsPerSet];
    updatedSetsData[index] = { ...updatedSetsData[index], reps };
    setRepsPerSet(updatedSetsData);
  };

  const updateWeightForSet = (index: number, weight: number | undefined) => {
    const updatedSetsData = [...repsPerSet];
    updatedSetsData[index] = { ...updatedSetsData[index], weight };
    setRepsPerSet(updatedSetsData);
  };

  const updateRepsForSetFromText = (index: number, value: string) => {
    const newReps = parseInt(value) || 0;
    updateRepsForSet(index, newReps);
  };

  const updateWeightForSetFromText = (index: number, value: string) => {
    const parsedWeight = parseFloat(value);
    const newWeight = isNaN(parsedWeight) || value.trim() === '' ? null : parsedWeight;
    updateWeightForSet(index, newWeight);
  };

  const handleUpdate = () => {
    if (sets < 1) {
      Alert.alert(t('common:error'), 'Number of sets must be at least 1.');
      return;
    }
    if (repsPerSet.some(setData => setData.reps < 1)) {
      Alert.alert(t('common:error'), 'Reps per set must be at least 1.');
      return;
    }

    // Process repsPerSet to ensure 'weight' is null if undefined
    const processedRepsPerSet = repsPerSet.map(setData => ({
      reps: setData.reps,
      weight: setData.weight === undefined ? null : setData.weight
    }));

    onUpdate({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets,
      reps: processedRepsPerSet,
      notes: notes.trim() || null,
    });

    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 15,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    closeButton: {
      padding: 4,
    },
    exerciseName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#22C55E',
      marginBottom: 20,
      textAlign: getTextAlign(isRTL),
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    counterContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    counterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    counterValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      minWidth: 60,
      textAlign: 'center',
    },
    repsContainer: {
      gap: 12,
    },
    setRow: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      gap: 12,
    },
    setLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      flex: 1,
      textAlign: getTextAlign(isRTL),
    },
    repsInputContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 8,
      flex: 2,
    },
    repsInput: {
      width: 70,
      height: 44,
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingHorizontal: 12,
      fontSize: 16,
      color: '#111827',
      textAlign: 'center',
    },
    repsLabel: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
      minWidth: 35,
    },
    weightInputContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      flex: 1,
    },
    weightInput: {
      width: 70,
      height: 44,
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingHorizontal: 12,
      fontSize: 16,
      color: '#111827',
      textAlign: 'center',
    },
    formInput: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 12,
      fontSize: 16,
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    notesInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    modalActions: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 24,
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#6B7280',
    },
    confirmButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: '#22C55E',
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Edit Exercise
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.exerciseName}>
            {getLocalizedExerciseName()}
          </Text>

          <ScrollView>
            {/* Sets */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('exercisesListScreen:sets')}</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateSetsCount(sets - 1)}
                >
                  <Minus size={20} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{sets}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateSetsCount(sets + 1)}
                >
                  <Plus size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reps per Set */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('exercisesListScreen:reps')}</Text>
              <View style={styles.repsContainer}>
                {repsPerSet.map((setData, index) => (
                  <View key={index} style={styles.setRow}>
                    <Text style={styles.setLabel}>
                      {t('exercisesListScreen:sets')} {index + 1}
                    </Text>
                    
                    <View style={styles.repsInputContainer}>
                      <TextInput
                        style={styles.repsInput}
                        value={setData.reps.toString()}
                        onChangeText={(text) => updateRepsForSetFromText(index, text)}
                        keyboardType="numeric"
                        placeholder="10"
                        placeholderTextColor="#9CA3AF"
                      />
                      <Text style={styles.repsLabel}>reps</Text>
                    </View>
                    
                    <View style={styles.weightInputContainer}>
                      <TextInput
                        style={styles.weightInput}
                        value={setData.weight?.toString() || ''}
                        onChangeText={(text) => updateWeightForSetFromText(index, text)}
                        keyboardType="numeric"
                        placeholder="kg"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('exercisesListScreen:notes')} - Optional</Text>
              <TextInput
                style={[styles.formInput, styles.notesInput]}
                placeholder={t('exercisesListScreen:notesPlaceholder')}
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t('common:cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleUpdate}>
              <Text style={styles.confirmButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}