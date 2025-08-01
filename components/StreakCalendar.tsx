import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Calendar, DateObject } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign } from '@/hooks/useRTL';
import { FirebaseService } from '@/services/firebaseService';
import fireIcon from '@/assets/icons/streaks/fire.png'; // Import the fire icon

interface StreakCalendarProps {
  userId: string;
}

export function StreakCalendar({ userId }: StreakCalendarProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(''); // YYYY-MM format

  // Initialize currentMonth to today's month on mount
  useEffect(() => {
    const today = new Date();
    setCurrentMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const fetchLoggedDates = useCallback(async (year: number, month: number) => {
    if (!userId) return;


    setLoading(true);
    setError(null);
    try {
      // Call the newly named function
      const dates = await FirebaseService.getDailyMealDatesForMonth(userId, year, month);
      

      const newMarkedDates = {};
      dates.forEach(dateString => {
        newMarkedDates[dateString] = {
          selected: true,
          marked: true,
          dotColor: '#F59E0B', // Optional: a dot color
          customStyles: {
            container: {
              backgroundColor: 'transparent', // Ensure background is transparent for custom component
            },
            text: {
              color: '#111827',
            },
          },
          logged: true, // Custom property to indicate a logged day
        };
      });
      setMarkedDates(newMarkedDates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streak data.');
      console.error('❌ StreakCalendar: Error fetching logged dates:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch data when currentMonth or userId changes
  useEffect(() => {
    if (currentMonth) {
      const [year, month] = currentMonth.split('-').map(Number);
      fetchLoggedDates(year, month);
    }
  }, [currentMonth, fetchLoggedDates]);

  // Custom Day Component to overlay the fire icon
  const CustomDayComponent = useCallback(({ date, state, marking }) => {
    const dayStyle: any = [styles.dayText];
    const containerStyle: any = [styles.dayContainer];

    if (state === 'today') {
      dayStyle.push(styles.todayText);
      containerStyle.push(styles.todayContainer);
    } else if (state === 'disabled') {
      dayStyle.push(styles.disabledText);
    }

    if (marking && marking.logged) {
      containerStyle.push(styles.loggedDayContainer);
    }

    return (
      <TouchableOpacity
        style={containerStyle}
        disabled={state === 'disabled'}
        onPress={() => {
          console.log('Day pressed:', date.dateString);
        }}
      >
        <Text style={dayStyle}>{date.day}</Text>
        {marking && marking.logged && (
          <Image source={fireIcon} style={styles.fireIcon} />
        )}
      </TouchableOpacity>
    );
  }, []);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 10,
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
    loadingContainer: {
      minHeight: 300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: '#EF4444',
      textAlign: 'center',
      marginTop: 10,
    },
    calendarHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    monthText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
    },
    arrowButton: {
      padding: 5,
    },
    dayContainer: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      position: 'relative',
    },
    dayText: {
      fontSize: 14,
      color: '#111827',
      fontWeight: '500',
    },
    todayText: {
      color: '#22C55E',
      fontWeight: '700',
    },
    todayContainer: {
      borderColor: '#22C55E',
      borderWidth: 1,
    },
    disabledText: {
      color: '#D1D5DB',
    },
    loggedDayContainer: {
      // No specific background, fire icon is the highlight
    },
    fireIcon: {
      position: 'absolute',
      width: 18,
      height: 18,
      bottom: -5,
      right: -5,
      zIndex: 1,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t('common:error')}: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        current={currentMonth}
        onDayPress={(day) => console.log('selected day', day)}
        onMonthChange={(month) => {
          setCurrentMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);
        }}
        markedDates={markedDates}
        markingType={'custom'}
        dayComponent={CustomDayComponent}
        enableSwipeMonths={true}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#22C55E',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: '#6B7280',
          disabledArrowColor: '#d9e1e8',
          monthTextColor: '#111827',
          indicatorColor: '#6B7280',
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 12,
        }}
        style={{
          borderRadius: 12,
        }}
      />
    </View>
  );
}
