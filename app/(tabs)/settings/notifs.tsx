import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, CheckCircle, XCircle, Settings, Clock, Coffee, Utensils, Moon, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { router } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationService } from '@/services/notificationService';
import { useEffect, useMemo, useState } from 'react';

type MealType = 'breakfast' | 'lunch' | 'dinner';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(hour: number, minute: number) {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${pad(minute)} ${ampm}`;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = ['ku', 'ckb', 'ar'].includes(t('currentLanguage'));
  const { permissionStatus, isLoading, requestPermission } = useNotifications();

  const [loadingReminders, setLoadingReminders] = useState(true);
  const [reminders, setReminders] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [times, setTimes] = useState<Record<MealType, { hour: number; minute: number }>>({
    breakfast: { hour: 11, minute: 0 },
    lunch: { hour: 15, minute: 0 },
    dinner: { hour: 20, minute: 30 },
  });

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMeal, setPickerMeal] = useState<MealType>('breakfast');
  const [pickerHour, setPickerHour] = useState(11);
  const [pickerMinute, setPickerMinute] = useState(0);

  const hourOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minuteOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);
  const periodOptions = ['AM', 'PM'];

  const [pickerPeriod, setPickerPeriod] = useState('AM');

  const handleGoBack = () => router.back();

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await NotificationService.getMealReminderSettings();
        setReminders({
          breakfast: !!settings.enabled.breakfast,
          lunch: !!settings.enabled.lunch,
          dinner: !!settings.enabled.dinner,
        });
        setTimes(settings.times);
      } catch {
        // ignore
      } finally {
        setLoadingReminders(false);
      }
    };
    if (permissionStatus === 'granted') {
      load();
    } else {
      setLoadingReminders(false);
    }
  }, [permissionStatus]);

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert('Success', 'Notifications enabled! You can now receive meal reminders and updates.');
    } else {
      Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive updates.');
    }
  };

  const toggleReminder = async (meal: MealType, value: boolean) => {
    try {
      setLoadingReminders(true);
      await NotificationService.setMealReminderEnabled(meal, value);
      setReminders(prev => ({ ...prev, [meal]: value }));
      if (value) {
        const label = formatTime(times[meal].hour, times[meal].minute);
        Alert.alert('Scheduled', `Daily ${meal} reminder set for ${label}.`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update reminder.');
    } finally {
      setLoadingReminders(false);
    }
  };

  const openPicker = (meal: MealType) => {
    setPickerMeal(meal);
    
    // Convert 24-hour to 12-hour format
    const hour24 = times[meal].hour;
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 < 12 ? 'AM' : 'PM';
    
    setPickerHour(hour12);
    setPickerMinute(times[meal].minute);
    setPickerPeriod(period);
    setPickerVisible(true);
  };

  const confirmPicker = async () => {
    try {
      setLoadingReminders(true);
      
      // Convert 12-hour to 24-hour format
      let hour24 = pickerHour;
      if (pickerPeriod === 'AM' && pickerHour === 12) {
        hour24 = 0;
      } else if (pickerPeriod === 'PM' && pickerHour !== 12) {
        hour24 = pickerHour + 12;
      }
      
      await NotificationService.setMealReminderTime(pickerMeal, hour24, pickerMinute);
      setTimes(prev => ({ ...prev, [pickerMeal]: { hour: hour24, minute: pickerMinute } }));
      
      if (reminders[pickerMeal]) {
        const label = formatTime(hour24, pickerMinute);
        Alert.alert('Updated', `${pickerMeal} reminder time changed to ${label}.`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update time.');
    } finally {
      setPickerVisible(false);
      setLoadingReminders(false);
    }
  };
  const toggleAllReminders = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Enable Notifications', 'Please enable notifications first to use meal reminders.');
      return;
    }
    
    const allEnabled = Object.values(reminders).every(enabled => enabled);
    const newValue = !allEnabled;
    
    try {
      setLoadingReminders(true);
      
      // Update all reminders
      for (const meal of ['breakfast', 'lunch', 'dinner'] as MealType[]) {
        await NotificationService.setMealReminderEnabled(meal, newValue);
      }
      
      setReminders({
        breakfast: newValue,
        lunch: newValue,
        dinner: newValue,
      });
      
      Alert.alert(
        newValue ? 'All Reminders Enabled' : 'All Reminders Disabled',
        newValue ? 'All meal reminders have been enabled.' : 'All meal reminders have been disabled.'
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update reminders.');
    } finally {
      setLoadingReminders(false);
    }
  };
  const getMealIcon = (meal: MealType) => {
    switch (meal) {
      case 'breakfast': return <Coffee size={20} color="#F59E0B" />;
      case 'lunch': return <Utensils size={20} color="#22C55E" />;
      case 'dinner': return <Moon size={20} color="#8B5CF6" />;
    }
  };

  const getMealLabel = (meal: MealType) => {
    switch (meal) {
      case 'breakfast': return 'Breakfast';
      case 'lunch': return 'Lunch';
      case 'dinner': return 'Dinner';
    }
  };

  const getStatusIcon = () => {
    if (permissionStatus === 'granted') return <CheckCircle size={24} color="#22C55E" />;
    if (permissionStatus === 'denied') return <XCircle size={24} color="#EF4444" />;
    return <Bell size={24} color="#6B7280" />;
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted': return 'Notifications Enabled';
      case 'denied': return 'Notifications Disabled';
      case 'undetermined': return 'Enable Notifications';
      default: return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (permissionStatus) {
      case 'granted': return '#22C55E';
      case 'denied': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAFAFA',
    },

    // Header Styles
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    headerTop: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1F2937',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 28,
    },

    // Content Styles
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 100,
    },

    // Status Card
    statusCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    statusHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    statusContent: {
      flex: 1,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 4,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    statusDescription: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textAlign: getTextAlign(isRTL),
    },
    enableButton: {
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: getFlexDirection(isRTL),
      gap: 8,
      marginTop: 16,
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    enableButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    disabledButton: {
      backgroundColor: '#9CA3AF',
      shadowOpacity: 0,
      elevation: 0,
    },

    // Meal Reminders Section
    reminderSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 20,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 20,
    },

    // Meal Items
    mealItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    mealItemLast: {
      borderBottomWidth: 0,
    },
    mealInfo: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    mealDetails: {
      flex: 1,
    },
    mealName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: 4,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textAlign: getTextAlign(isRTL),
    },
    mealTime: {
      fontSize: 14,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textAlign: getTextAlign(isRTL),
    },
    mealActions: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 12,
    },
    timeButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: 'transparent',
    },
    timeButtonDisabled: {
      opacity: 0.5,
    },
    timeButtonText: {
      fontSize: 13,
      color: '#22C55E',
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Info Section
    infoSection: {
      backgroundColor: '#F0FDF4',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#BBF7D0',
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#16A34A',
      marginBottom: 12,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    infoItem: {
      fontSize: 14,
      color: '#15803D',
      lineHeight: 22,
      marginBottom: 6,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Loading State
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },

    // Time Picker Modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 20,
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    pickerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 8,
    },
    pickerColumn: {
      flex: 1,
      height: 180,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      backgroundColor: '#FAFAFA',
    },
    pickerItem: {
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    pickerItemLast: {
      borderBottomWidth: 0,
    },
    pickerText: {
      fontSize: 16,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    pickerTextSelected: {
      fontWeight: '700',
      color: '#1F2937',
    },
    modalActions: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'flex-end',
      gap: 12,
    },
    modalButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },
    cancelButton: {
      backgroundColor: '#F3F4F6',
    },
    confirmButton: {
      backgroundColor: '#22C55E',
    },
    cancelButtonText: {
      color: '#6B7280',
      fontSize: 15,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            {isRTL ? (
              <ArrowLeft size={20} color="#374151" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={20} color="#374151" />
            )}
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getStatusIcon()}
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
              <Text style={styles.statusDescription}>
                {permissionStatus === 'granted'
                  ? 'You will receive meal reminders, weekly reports, and important updates.'
                  : 'Enable notifications to receive meal reminders and stay updated with your nutrition progress.'}
              </Text>
            </View>
          </View>

          {permissionStatus !== 'granted' && (
            <TouchableOpacity
              style={[styles.enableButton, isLoading && styles.disabledButton]}
              onPress={handlePermissionRequest}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Settings size={20} color="#FFFFFF" />
              )}
              <Text style={styles.enableButtonText}>
                {isLoading ? 'Requesting...' : 'Enable Notifications'}
              </Text>
            </TouchableOpacity>
          )}
        </View>



        {/* Meal Reminders Section */}
        <View style={styles.reminderSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Meal Reminders</Text>
            <Switch
                    value={Object.values(reminders).every(Boolean)}
                    onValueChange={toggleAllReminders}
                    disabled={permissionStatus !== 'granted' || loadingReminders}
                    trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                    thumbColor={Object.values(reminders).every(Boolean) ? '#22C55E' : '#F3F4F6'}
                    />
          </View>
          <Text style={styles.sectionSubtitle}>
            Get reminded to log your meals and stay on track with your nutrition goals.
          </Text>

          {loadingReminders ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
            </View>
          ) : (
            <>
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal, index) => (
                <View
                  key={meal}
                  style={[
                    styles.mealItem,
                    index === 2 && styles.mealItemLast
                  ]}
                >
                  <View style={styles.mealInfo}>
                    {getMealIcon(meal)}
                    <View style={styles.mealDetails}>
                      <Text style={styles.mealName}>
                        {getMealLabel(meal)} Reminder
                      </Text>
                      <Text style={styles.mealTime}>
                        {formatTime(times[meal].hour, times[meal].minute)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mealActions}>
                    <TouchableOpacity
                      style={[
                        styles.timeButton,
                        permissionStatus !== 'granted' && styles.timeButtonDisabled
                      ]}
                      onPress={() => openPicker(meal)}
                      disabled={permissionStatus !== 'granted'}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeButtonText}>Change</Text>
                    </TouchableOpacity>

                    <Switch
                      value={reminders[meal]}
                      onValueChange={(v) => toggleReminder(meal, v)}
                      disabled={permissionStatus !== 'granted'}
                      trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                      thumbColor={reminders[meal] ? '#22C55E' : '#F3F4F6'}
                    />
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={[styles.infoTitle, { flexDirection: getFlexDirection(isRTL), alignItems: 'center', gap: 8 }]}>
            <Bell size={16} color="#16A34A" />
            <Text style={[styles.infoTitle, { marginBottom: 0 }]}>
              What you'll receive:
            </Text>
          </View>
          <Text style={styles.infoItem}>• Daily meal reminders at your chosen times</Text>
          <Text style={styles.infoItem}>• Weekly nutrition progress reports</Text>
          <Text style={styles.infoItem}>• Monthly goal achievement summaries</Text>
          <Text style={styles.infoItem}>• Tips and motivation to stay on track</Text>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        transparent
        visible={pickerVisible}
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.modalContainer} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              Set {getMealLabel(pickerMeal)} Time
            </Text>

            <View style={styles.pickerRow}>
              {/* Hours Column */}
              <View style={styles.pickerColumn}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {hourOptions.map((h, index) => (
                    <Pressable
                      key={h}
                      style={[
                        styles.pickerItem,
                        index === hourOptions.length - 1 && styles.pickerItemLast
                      ]}
                      onPress={() => setPickerHour(h)}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          h === pickerHour && styles.pickerTextSelected
                        ]}
                      >
                        {h}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Minutes Column */}
              <View style={styles.pickerColumn}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {minuteOptions.map((m, index) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.pickerItem,
                        index === minuteOptions.length - 1 && styles.pickerItemLast
                      ]}
                      onPress={() => setPickerMinute(m)}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          m === pickerMinute && styles.pickerTextSelected
                        ]}
                      >
                        {pad(m)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* AM/PM Column */}
              <View style={styles.pickerColumn}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {periodOptions.map((period, index) => (
                    <Pressable
                      key={period}
                      style={[
                        styles.pickerItem,
                        index === periodOptions.length - 1 && styles.pickerItemLast
                      ]}
                      onPress={() => setPickerPeriod(period)}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          period === pickerPeriod && styles.pickerTextSelected
                        ]}
                      >
                        {period}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPickerVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmPicker}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Save Time</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}