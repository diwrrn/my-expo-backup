import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X, ListPlus, SquarePlus as PlusSquare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

interface ChoosePlanActionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectAction: (action: 'add_to_existing' | 'create_new') => void;
}

export function ChoosePlanActionModal({
  isVisible,
  onClose,
  onSelectAction,
}: ChoosePlanActionModalProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

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
      padding: 24,
      width: '90%',
      maxWidth: 400,
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
    actionButton: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
    },
    actionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
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
            <Text style={styles.modalTitle}>Choose Action</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSelectAction('add_to_existing')}
          >
            <View style={styles.actionIcon}>
              <ListPlus size={20} color="#3B82F6" />
            </View>
            <Text style={styles.actionButtonText}>Add to Existing Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSelectAction('create_new')}
          >
            <View style={styles.actionIcon}>
              <PlusSquare size={20} color="#22C55E" />
            </View>
            <Text style={styles.actionButtonText}>Create New Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}