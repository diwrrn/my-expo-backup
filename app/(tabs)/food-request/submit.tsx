// app/(tabs)/food-request/submit.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, List } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useFoodRequests } from '@/hooks/useFoodRequests';

export default function FoodRequestSubmitScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const { submitRequest } = useFoodRequests();

  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!foodName.trim()) {
      Alert.alert(t('common:error'), t('foodRequest:foodNameRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRequest(foodName.trim(), description.trim() || undefined);

      Alert.alert(t('common:success'), t('foodRequest:requestSubmitted'));
      setFoodName('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting food request:', error);
      Alert.alert(t('common:error'), t('foodRequest:submissionFailed'));
    } finally {
      setIsSubmitting(false);
    }
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    formSection: {
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    inputContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    textInput: {
      fontSize: 16,
      color: '#111827',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    multilineInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    submitButton: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 16,
      gap: 8,
      marginTop: 20,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    historyButton: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 16,
      gap: 8,
      marginTop: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    historyButtonText: {
      color: '#374151',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
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
              <Text style={styles.headerTitle}>{t('foodRequest:requestFood')}</Text>
              <Text style={styles.headerSubtitle}>{t('foodRequest:requestFoodSubtitle')}</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('foodRequest:foodName')}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('foodRequest:foodNamePlaceholder')}
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('foodRequest:description')} ({t('common:optional')})</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder={t('foodRequest:descriptionPlaceholder')}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitRequest}
              disabled={isSubmitting}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? t('foodRequest:submitting') : t('foodRequest:submitRequest')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => router.push('/(tabs)/food-request/history')}
            >
              <List size={20} color="#374151" />
              <Text style={styles.historyButtonText}>{t('foodRequest:viewHistory')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}