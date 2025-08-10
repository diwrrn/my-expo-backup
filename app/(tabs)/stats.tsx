import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';

import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService, WeeklyReportDocument, MonthlyReportDocument } from '@/services/firebaseService';
import { getLastCompletedFriThuWindow, getLastCompletedMonthWindow } from '@/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
const MIN_MONTH_DAYS = 10;
const TZ_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function StatsScreen() {
  const { user } = useAuth();

  // Timezone-aware windows
  const [tz, setTz] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

useEffect(() => {
  (async () => {
    if (!user?.id) return;
    try {
      const key = `tzCache:${user.id}`;
      const raw = await AsyncStorage.getItem(key);
      let usedCached = false;

      if (raw) {
        const { savedAt, tz: cachedTz } = JSON.parse(raw) as { savedAt: number; tz: string };
        if (cachedTz && Date.now() - savedAt <= TZ_CACHE_TTL_MS) {
          setTz(cachedTz);
          usedCached = true;
        }
      }

      if (!usedCached) {
        const savedTz = await FirebaseService.getUserTimezone(user.id);
        if (savedTz) {
          setTz(savedTz);
          await AsyncStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), tz: savedTz }));
        }
      }
    } catch {
      // ignore
    }
  })();
}, [user?.id]);

  const { start: startDate, end: endDate } = getLastCompletedFriThuWindow(tz);
  const { start: monthStart, end: monthEnd } = getLastCompletedMonthWindow(tz);

  // Weekly states
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [currentDoc, setCurrentDoc] = useState<WeeklyReportDocument | null>(null);
  const [prevReports, setPrevReports] = useState<WeeklyReportDocument[]>([]);
  const [loadingPrev, setLoadingPrev] = useState(true);

  // Monthly states
  const [monthEligible, setMonthEligible] = useState<boolean | null>(null);
  const [checkingMonthEligibility, setCheckingMonthEligibility] = useState(true);
  const [monthCurrentDoc, setMonthCurrentDoc] = useState<MonthlyReportDocument | null>(null);
  const [monthPrevReports, setMonthPrevReports] = useState<MonthlyReportDocument[]>([]);
  const [loadingMonthPrev, setLoadingMonthPrev] = useState(true);

  // Load weekly data
  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        setCheckingEligibility(true);
        const existing = await FirebaseService.getWeeklyReport(user.id, startDate, endDate);
        if (existing) {
          setEligible((existing.daysWithData ?? 0) >= 3);
          setCurrentDoc(existing);
        } else {
          setEligible(null);
          setCurrentDoc(null);
        }
      } catch {
        setEligible(null);
        setCurrentDoc(null);
      } finally {
        setCheckingEligibility(false);
      }
    })();
  }, [user?.id, startDate, endDate]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
  
      let cancelled = false;
  
      (async () => {
        try {
          setLoadingPrev(true);
          const weeklyDocs = await FirebaseService.listWeeklyReports(user.id, 8);
          if (!cancelled) setPrevReports(weeklyDocs);
        } catch {
          if (!cancelled) setPrevReports([]);
        } finally {
          if (!cancelled) setLoadingPrev(false);
        }
  
        try {
          setLoadingMonthPrev(true);
          const monthlyDocs = await FirebaseService.listMonthlyReports(user.id, 8);
          if (!cancelled) setMonthPrevReports(monthlyDocs);
        } catch {
          if (!cancelled) setMonthPrevReports([]);
        } finally {
          if (!cancelled) setLoadingMonthPrev(false);
        }
      })();
  
      return () => {
        cancelled = true;
      };
    }, [user?.id])
  );
  // Load monthly data
  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        setCheckingMonthEligibility(true);
        const existing = await FirebaseService.getMonthlyReport(user.id, monthStart, monthEnd);
        if (existing) {
          setMonthEligible((existing.daysWithData ?? 0) >= MIN_MONTH_DAYS);
          setMonthCurrentDoc(existing);
        } else {
          setMonthEligible(null);
          setMonthCurrentDoc(null);
        }
      } catch {
        setMonthEligible(null);
        setMonthCurrentDoc(null);
      } finally {
        setCheckingMonthEligibility(false);
      }
    })();
  }, [user?.id, monthStart, monthEnd]);


  const formatDateRange = (start: string, end: string) => {
    const startObj = new Date(start);
    const endObj = new Date(end);
    const startMonth = startObj.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endObj.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startObj.getDate();
    const endDay = endObj.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  const formatMonth = (start: string) => {
    const startObj = new Date(start);
    return startObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getWeeklyStatus = () => {
    if (checkingEligibility) return { text: 'Checking...', disabled: true };
    if (!!currentDoc) return { text: 'View Report', disabled: false };
    if (eligible === false) return { text: 'Need 3+ days', disabled: true };
    return { text: 'Generate Report', disabled: false };
  };

  const getMonthlyStatus = () => {
    if (checkingMonthEligibility) return { text: 'Checking...', disabled: true };
    if (!!monthCurrentDoc) return { text: 'View Report', disabled: false };
    if (monthEligible === false) return { text: `Need ${MIN_MONTH_DAYS}+ days`, disabled: true };
    return { text: 'Generate Report', disabled: false };
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAFAFA',
    },
    
    // Header
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
      marginLeft: 16,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1F2937',
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: 2,
    },

    // Content
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 100,
    },

    // Intro Section
    introCard: {
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    introTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
    },
    introText: {
      fontSize: 14,
      color: '#64748B',
      lineHeight: 20,
    },

    // Report Types Grid
    reportsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
    },
    reportTypeCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    reportTypeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    reportTypeIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F0FDF4',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    reportTypeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      flex: 1,
    },
    reportTypePeriod: {
      fontSize: 13,
      color: '#6B7280',
      marginBottom: 16,
    },
    reportTypeButton: {
      backgroundColor: '#22C55E',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    reportTypeButtonDisabled: {
      backgroundColor: '#9CA3AF',
    },
    reportTypeButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    reportTypeNote: {
      marginTop: 8,
      fontSize: 12,
      color: '#6B7280',
      lineHeight: 16,
    },
    reportTypeNoteWarning: {
      color: '#D97706',
    },
    reportTypeNoteSuccess: {
      color: '#059669',
    },

    // Combined History Section
    historySection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    historyToggle: {
      flexDirection: 'row',
      backgroundColor: '#F3F4F6',
      borderRadius: 6,
      padding: 2,
    },
    toggleButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    toggleButtonActive: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    toggleButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#6B7280',
    },
    toggleButtonTextActive: {
      color: '#111827',
    },
    historyDescription: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      marginBottom: 20,
    },

    // Report Items
    reportItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    reportItemLast: {
      borderBottomWidth: 0,
    },
    reportContent: {
      flex: 1,
    },
    reportDate: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 2,
    },
    reportMeta: {
      fontSize: 13,
      color: '#6B7280',
    },
    reportAction: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      gap: 4,
    },
    reportActionEnabled: {
      backgroundColor: '#F0FDF4',
    },
    reportActionDisabled: {
      backgroundColor: '#F9FAFB',
    },
    reportActionText: {
      fontSize: 13,
      fontWeight: '500',
    },
    reportActionTextEnabled: {
      color: '#059669',
    },
    reportActionTextDisabled: {
      color: '#9CA3AF',
    },

    // Loading & Empty States
    loadingContainer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: 8,
    },
    emptyContainer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: '#9CA3AF',
      textAlign: 'center',
    },
  });

  const [historyView, setHistoryView] = useState<'weekly' | 'monthly'>('weekly');

  const currentReports = historyView === 'weekly' ? prevReports : monthPrevReports;
  const isLoadingReports = historyView === 'weekly' ? loadingPrev : loadingMonthPrev;
  const minDays = historyView === 'weekly' ? 3 : MIN_MONTH_DAYS;

  const weeklyStatus = getWeeklyStatus();
  const monthlyStatus = getMonthlyStatus();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <HamburgerMenu currentRoute="/(tabs)/stats" />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Reports</Text>
            <Text style={styles.headerSubtitle}>Track your nutrition journey</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Intro for new users */}
          {prevReports.length === 0 && monthPrevReports.length === 0 && !currentDoc && !monthCurrentDoc && (
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>Nutrition Reports</Text>
              <Text style={styles.introText}>
                Generate weekly and monthly reports to track your progress. Weekly reports need 3+ days of logged meals, 
                monthly reports need {MIN_MONTH_DAYS}+ days for comprehensive analytics.
              </Text>
            </View>
          )}

          {/* Current Reports Grid */}
          <View style={styles.reportsGrid}>
            {/* Weekly Report */}
            <View style={styles.reportTypeCard}>
              <View style={styles.reportTypeHeader}>
                <View style={styles.reportTypeIcon}>
                  <Calendar size={16} color="#22C55E" />
                </View>
                <Text style={styles.reportTypeTitle}>Weekly</Text>
              </View>

              <Text style={styles.reportTypePeriod}>
                {formatDateRange(startDate, endDate)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.reportTypeButton,
                  weeklyStatus.disabled && styles.reportTypeButtonDisabled,
                ]}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/weekly-report', params: { start: startDate, end: endDate } })
                }
                disabled={weeklyStatus.disabled}
                activeOpacity={0.8}
              >
                <Text style={styles.reportTypeButtonText}>{weeklyStatus.text}</Text>
              </TouchableOpacity>

              {eligible === false && (
                <Text style={[styles.reportTypeNote, styles.reportTypeNoteWarning]}>
                  Log 3+ days this week for report
                </Text>
              )}

              {!!currentDoc && (
                <Text style={[styles.reportTypeNote, styles.reportTypeNoteSuccess]}>
                  Report ready to view
                </Text>
              )}

              {eligible === null && !checkingEligibility && !currentDoc && (
                <Text style={styles.reportTypeNote}>
                  Will generate on first access
                </Text>
              )}
            </View>

            {/* Monthly Report */}
            <View style={styles.reportTypeCard}>
              <View style={styles.reportTypeHeader}>
                <View style={styles.reportTypeIcon}>
                  <Calendar size={16} color="#22C55E" />
                </View>
                <Text style={styles.reportTypeTitle}>Monthly</Text>
              </View>

              <Text style={styles.reportTypePeriod}>
                {formatMonth(monthStart)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.reportTypeButton,
                  monthlyStatus.disabled && styles.reportTypeButtonDisabled,
                ]}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/monthly-report', params: { start: monthStart, end: monthEnd } })
                }
                disabled={monthlyStatus.disabled}
                activeOpacity={0.8}
              >
                <Text style={styles.reportTypeButtonText}>{monthlyStatus.text}</Text>
              </TouchableOpacity>

              {monthEligible === false && (
                <Text style={[styles.reportTypeNote, styles.reportTypeNoteWarning]}>
                  Log {MIN_MONTH_DAYS}+ days this month for report
                </Text>
              )}

              {!!monthCurrentDoc && (
                <Text style={[styles.reportTypeNote, styles.reportTypeNoteSuccess]}>
                  Report ready to view
                </Text>
              )}

              {monthEligible === null && !checkingMonthEligibility && !monthCurrentDoc && (
                <Text style={styles.reportTypeNote}>
                  Will generate on first access
                </Text>
              )}
            </View>
          </View>

          {/* Combined History Section */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Report History</Text>
              
              <View style={styles.historyToggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    historyView === 'weekly' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setHistoryView('weekly')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    historyView === 'weekly' && styles.toggleButtonTextActive,
                  ]}>
                    Weekly
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    historyView === 'monthly' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setHistoryView('monthly')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    historyView === 'monthly' && styles.toggleButtonTextActive,
                  ]}>
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.historyDescription}>
              {historyView === 'weekly' 
                ? 'Access your previous weekly reports (Fri-Thu periods).'
                : 'Access your previous monthly nutrition reports.'
              }
            </Text>

            {isLoadingReports ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>Loading reports...</Text>
              </View>
            ) : currentReports.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No previous {historyView} reports yet.{'\n'}Keep logging meals to build your history!
                </Text>
              </View>
            ) : (
              <>
                {currentReports.map((report, index) => {
                  const isEligible = (report.daysWithData ?? 0) >= minDays;
                  const isLast = index === currentReports.length - 1;
                  
                  return (
                    <TouchableOpacity
                      key={`${report.startDate}_${report.endDate}`}
                      style={[styles.reportItem, isLast && styles.reportItemLast]}
                      onPress={() =>
                        isEligible && router.push({ 
                          pathname: historyView === 'weekly' ? '/(tabs)/weekly-report' : '/(tabs)/monthly-report',
                          params: { start: report.startDate, end: report.endDate } 
                        })
                      }
                      disabled={!isEligible}
                      activeOpacity={isEligible ? 0.7 : 1}
                    >
                      <View style={styles.reportContent}>
                        <Text style={styles.reportDate}>
                          {historyView === 'weekly' 
                            ? formatDateRange(report.startDate, report.endDate)
                            : formatMonth(report.startDate)
                          }
                        </Text>
                        <Text style={styles.reportMeta}>
                          {report.daysWithData ?? 0} days logged • {isEligible ? 'Ready' : 'Insufficient data'}
                        </Text>
                      </View>

                      <View style={[
                        styles.reportAction,
                        isEligible ? styles.reportActionEnabled : styles.reportActionDisabled
                      ]}>
                        <Text style={[
                          styles.reportActionText,
                          isEligible ? styles.reportActionTextEnabled : styles.reportActionTextDisabled
                        ]}>
                          {isEligible ? 'View' : 'Skip'}
                        </Text>
                        {isEligible && <ChevronRight size={14} color="#059669" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 