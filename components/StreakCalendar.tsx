import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { useStreakManager } from '@/contexts/StreakGlobal';
import { Flame, Trophy, Target, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface StreakCalendarProps {
  userId: string;
}

export function StreakCalendar({ userId }: StreakCalendarProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  // Use our bulletproof streak system
  const { 
    currentStreak, 
    bestStreak, 
    isLoading, 
    error, 
    getMonthlyDates,
    initializeUser 
  } = useStreakManager();

  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [monthStats, setMonthStats] = useState({
    totalDays: 0,
    loggedDays: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  // Initialize user when component mounts
  useEffect(() => {
    if (userId) {
      initializeUser(userId);
    }
  }, [userId, initializeUser]);

  // Fetch monthly dates
  const fetchMonthlyDates = async (year: number, month: number) => {
    try {
      const dates = await getMonthlyDates(year, month);
      setMarkedDates(dates);
      
      // Calculate stats
      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
      const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
      
      setMonthStats({
        totalDays: currentDay,
        loggedDays: dates.length,
        currentStreak: currentStreak, // Use from global state
        bestStreak: bestStreak // Use from global state
      });
      
    } catch (err) {
      console.error('❌ StreakCalendar: Error fetching dates:', err);
    }
  };

  // Load initial data
  useEffect(() => {
    if (userId) {
      const today = new Date();
      fetchMonthlyDates(today.getFullYear(), today.getMonth() + 1);
    }
  }, [userId]);

  // Update stats when global streak changes
  useEffect(() => {
    setMonthStats(prev => ({
      ...prev,
      currentStreak,
      bestStreak
    }));
  }, [currentStreak, bestStreak]);

  // Navigation handler
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    fetchMonthlyDates(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  // Generate calendar days - simplified
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const isLogged = markedDates.includes(dateString);
      
      days.push({
        day,
        dateString,
        isToday,
        isLogged
      });
    }
    
    return days;
  }, [currentDate, markedDates]);

  // Helper functions
  const getCompletionPercentage = () => {
    return monthStats.totalDays > 0 ? Math.round((monthStats.loggedDays / monthStats.totalDays) * 100) : 0;
  };

  const getMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Simple loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </View>
    );
  }

  // Simple error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <CalendarIcon size={48} color="#EF4444" />
          <Text style={styles.errorText}>Unable to load calendar</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollContainer} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header Stats */}
        <View style={styles.headerStats}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.mainStatCard}>
              <View style={styles.statIconLarge}>
                <Flame size={20} color="#F59E0B" />
              </View>
              <Text style={styles.mainStatValue}>{currentStreak}</Text>
              <Text style={styles.mainStatLabel}>Day Streak</Text>
            </View>
            
            <View style={styles.sideStats}>
              <View style={styles.sideStatCard}>
                <Target size={14} color="#10B981" />
                <View style={styles.sideStatText}>
                  <Text style={styles.sideStatValue}>{monthStats.loggedDays}</Text>
                  <Text style={styles.sideStatLabel}>Logged</Text>
                </View>
              </View>
              
              <View style={styles.sideStatCard}>
                <Trophy size={14} color="#8B5CF6" />
                <View style={styles.sideStatText}>
                  <Text style={styles.sideStatValue}>{getCompletionPercentage()}%</Text>
                  <Text style={styles.sideStatLabel}>Complete</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateMonth('prev')}
          >
            <ChevronLeft size={20} color="#64748B" />
          </TouchableOpacity>
          
          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>{getMonthYear()}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateMonth('next')}
          >
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Custom Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Week Days Header */}
          <View style={styles.weekDaysHeader}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekDayContainer}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayData, index) => (
              <View key={index} style={styles.dayCell}>
                {dayData ? (
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      dayData.isLogged && styles.loggedDay,
                      dayData.isToday && styles.todayDay,
                      dayData.isToday && dayData.isLogged && styles.todayLoggedDay
                    ]}
                    onPress={() => console.log('Day pressed:', dayData.dateString)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dayText,
                      dayData.isLogged && styles.loggedDayText,
                      dayData.isToday && styles.todayDayText,
                      dayData.isToday && dayData.isLogged && styles.todayLoggedDayText
                    ]}>
                      {dayData.day}
                    </Text>
                    
                    {dayData.isLogged && (
                      <View style={styles.streakDot}>
                        <Flame size={8} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyDay} />
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Keep your existing styles - they're fine!
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 6,
    marginBottom: 20,
    marginTop: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
    minHeight: 400,
  },
  headerStats: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  mainStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  sideStats: {
    gap: 8,
  },
  sideStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 100,
  },
  sideStatText: {
    flex: 1,
  },
  sideStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  sideStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  calendarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28571%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  emptyDay: {
    flex: 1,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  loggedDay: {
    backgroundColor: '#10B981',
  },
  loggedDayText: {
    color: '#FFFFFF',
  },
  todayDay: {
    backgroundColor: '#EBF8FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  todayDayText: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  todayLoggedDay: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  todayLoggedDayText: {
    color: '#FFFFFF',
  },
  streakDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});