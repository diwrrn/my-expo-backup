import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, CheckCircle, XCircle, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { router } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { permissionStatus, isLoading, requestPermission, sendTestNotification } = useNotifications();

  const handleGoBack = () => {
    router.back();
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert('Success', 'Notifications enabled! You can now receive notifications.');
    } else {
      Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive updates.');
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      Alert.alert('Success', 'Test notification sent! Check your notification panel.');
    } else {
      Alert.alert('Error', 'Failed to send test notification. Please check your notification settings.');
    }
  };

  const getStatusIcon = () => {
    if (permissionStatus === 'granted') {
      return <CheckCircle size={24} color="#10B981" />;
    } else if (permissionStatus === 'denied') {
      return <XCircle size={24} color="#EF4444" />;
    } else {
      return <Bell size={24} color="#6B7280" />;
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications Enabled';
      case 'denied':
        return 'Notifications Disabled';
      case 'undetermined':
        return 'Permission Not Requested';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return '#10B981';
      case 'denied':
        return '#EF4444';
      default:
        return '#6B7280';
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
    content: {
      padding: 24,
    },
    statusCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusIcon: {
      marginRight: 12,
    },
    statusText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    statusDescription: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      marginBottom: 16,
    },
    actionButton: {
      backgroundColor: '#3B82F6',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    testButton: {
      backgroundColor: '#10B981',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
    },
    testButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    disabledButton: {
      backgroundColor: '#9CA3AF',
    },
    infoSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      marginBottom: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
          {/* Header */}
          <View style={[styles.header, { flexDirection: getFlexDirection(isRTL) }]}>
            <TouchableOpacity
              style={[styles.backButton, { marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }]}
              onPress={handleGoBack}
            >
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { textAlign: getTextAlign(isRTL) }]}>
                Notifications
              </Text>
              <Text style={[styles.headerSubtitle, { textAlign: getTextAlign(isRTL) }]}>
                Manage your notification preferences
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View style={styles.statusIcon}>
                  {getStatusIcon()}
                </View>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
              
              <Text style={styles.statusDescription}>
                {permissionStatus === 'granted' 
                  ? 'You will receive notifications for weekly reports, meal reminders, and important updates.'
                  : 'Enable notifications to stay updated with your nutrition progress and receive weekly reports.'
                }
              </Text>

              {permissionStatus !== 'granted' && (
                <TouchableOpacity
                  style={[styles.actionButton, isLoading && styles.disabledButton]}
                  onPress={handlePermissionRequest}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Settings size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isLoading ? 'Requesting...' : 'Enable Notifications'}
                  </Text>
                </TouchableOpacity>
              )}

              {permissionStatus === 'granted' && (
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={handleTestNotification}
                >
                  <Bell size={20} color="#FFFFFF" />
                  <Text style={styles.testButtonText}>
                    Send Test Notification
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>What you'll receive:</Text>
              <Text style={styles.infoText}>• Weekly nutrition reports</Text>
              <Text style={styles.infoText}>• Monthly progress summaries</Text>
              <Text style={styles.infoText}>• Meal reminders and tips</Text>
              <Text style={styles.infoText}>• Goal achievement notifications</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}