// app/(tabs)/food-request/history.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useFoodRequests } from '@/hooks/useFoodRequests';


export default function FoodRequestHistoryScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';

  const { requests, loading, error } = useFoodRequests();

  const formatRequestDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    requestsList: {
      padding: 24,
    },
    requestCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    requestInfo: {
      flex: 1,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    requestName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    requestDescription: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    requestMeta: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    requestDate: {
      fontSize: 12,
      color: '#9CA3AF',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    statusIcon: {
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
      padding: 24,
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
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
              <Text style={styles.headerTitle}>{t('foodRequest:requestHistory')}</Text>
              <Text style={styles.headerSubtitle}>{t('foodRequest:requestHistorySubtitle')}</Text>
            </View>
          </View>

          {/* Requests List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={{ color: '#6B7280', marginTop: 10, fontFamily: useKurdishFont ? 'rudawregular2' : undefined }}>{t('common:loading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>{t('common:error')}: {error}</Text>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('foodRequest:noRequests')}</Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {requests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{request.foodName}</Text>
                    {request.description && (
                      <Text style={styles.requestDescription}>{request.description}</Text>
                    )}
                    <View style={styles.requestMeta}>
                      <Clock size={12} color="#9CA3AF" />
                      <Text style={[styles.requestDate, { marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }]}>
                        {formatRequestDate(request.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusIcon}>
                    {request.status ? (
                      <CheckCircle size={24} color="#22C55E" />
                    ) : (
                      <Clock size={24} color="#F59E0B" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}