import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Bell, BellOff, Settings } from 'lucide-react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import * as Linking from 'expo-linking';

export function NotificationPermissionCard() {
  const { expoPushToken, error, isLoading, sendTestNotification } = useNotifications();
  const { t } = useTranslation();
  const isRTL = useRTL();

  const handleOpenSettings = () => {
    Alert.alert(
      'Notification Settings',
      'To enable notifications, please go to your device settings and allow notifications for this app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings()
        }
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Success', 'Test notification sent! Check your notification panel.');
    } catch (err) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const getStatusColor = () => {
    if (isLoading) return '#6B7280';
    if (error) return '#EF4444';
    if (expoPushToken) return '#22C55E';
    return '#F59E0B';
  };

  const getStatusText = () => {
    if (isLoading) return 'Setting up notifications...';
    if (error) return 'Notifications disabled';
    if (expoPushToken) return 'Notifications enabled';
    return 'Notifications not configured';
  };

  const getStatusIcon = () => {
    if (error || !expoPushToken) {
      return <BellOff size={20} color={getStatusColor()} />;
    }
    return <Bell size={20} color={getStatusColor()} />;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    header: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 12,
    },
    statusIcon: {
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
    },
    status: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
    },
    description: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      marginBottom: 16,
      textAlign: getTextAlign(isRTL),
    },
    actions: {
      flexDirection: getFlexDirection(isRTL),
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
    },
    primaryButton: {
      backgroundColor: '#22C55E',
      borderColor: '#22C55E',
    },
    secondaryButton: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 6,
      marginRight: isRTL ? 6 : 0,
    },
    secondaryButtonText: {
      color: '#374151',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 6,
      marginRight: isRTL ? 6 : 0,
    },
    tokenInfo: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
    },
    tokenLabel: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '500',
      marginBottom: 4,
    },
    tokenText: {
      fontSize: 10,
      color: '#374151',
      fontFamily: 'monospace',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusIcon}>
          {getStatusIcon()}
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Push Notifications</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        {expoPushToken 
          ? 'Get notified about meal reminders, goal achievements, and weekly progress updates.'
          : 'Enable notifications to receive meal reminders and track your progress more effectively.'
        }
      </Text>

      <View style={styles.actions}>
        {!expoPushToken && !isLoading && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleOpenSettings}
          >
            <Settings size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Enable Notifications</Text>
          </TouchableOpacity>
        )}

        {expoPushToken && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleTestNotification}
          >
            <Bell size={16} color="#374151" />
            <Text style={styles.secondaryButtonText}>Send Test</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Show token info in development */}
      {__DEV__ && expoPushToken && (
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenLabel}>Push Token (Development):</Text>
          <Text style={styles.tokenText} numberOfLines={2}>
            {expoPushToken}
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.tokenInfo, { backgroundColor: '#FEF2F2' }]}>
          <Text style={[styles.tokenLabel, { color: '#EF4444' }]}>Error:</Text>
          <Text style={[styles.tokenText, { color: '#EF4444' }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}