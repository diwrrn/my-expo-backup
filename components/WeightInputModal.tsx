import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';

interface WeightInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number) => Promise<void>;
}

export function WeightInputModal({ visible, onClose, onSave }: WeightInputModalProps) {
  const { t } = useTranslation();
  const [weightInput, setWeightInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0 || weight > 500) {
      Alert.alert(t('common:error'), t('profileScreen:invalidWeight'));
      return;
    }
  
    setLoading(true);
    try {
        await onSave(weight);
        setWeightInput('');
        onClose(); // Just close modal, don't navigate
        Alert.alert(t('common:success'), t('profileScreen:weightLogged'));
      } catch (error) {
        Alert.alert(t('common:error'), t('profileScreen:weightLogError'));
      } finally {
        setLoading(false);
      }
    };
      const handleClose = () => {
    setWeightInput('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('profileScreen:logWeight')}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>{t('profileScreen:enterWeight')}</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="70"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <Text style={styles.unit}>kg</Text>
          </View>
          
          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t('common:cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? '...' : t('common:save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
  },
  unit: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});