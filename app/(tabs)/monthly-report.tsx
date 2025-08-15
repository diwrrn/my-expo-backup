import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Download } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppStore } from '@/store/appStore';
import { FirebaseService } from '@/services/firebaseService';
import { PDFService } from '@/services/pdfService';
import { WeeklyReportDisplay } from '@/components/WeeklyReportDisplay';

type Source = 'cache' | 'firestore' | 'computed' | null;
const MIN_MONTH_DAYS = 10;
const CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

type CachedEnvelope = {
  savedAt: number;
  doc: any; // MonthlyReportDocument
};

export default function MonthlyReportScreen() {
  const { start, end } = useLocalSearchParams<{ start: string; end: string }>();
  const startDate = String(start);
  const endDate = String(end);
  const user = useAppStore(state => state.user);
  const profile = useAppStore(state => state.profile);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<any | null>(null); // MonthlyReportDocument
  const [source, setSource] = useState<Source>(null);

  // Cache control flags
  const [cacheFresh, setCacheFresh] = useState(false);
  const [cacheChecked, setCacheChecked] = useState(false);

  const cacheKey = user?.id ? `monthlyReport:${user.id}:${startDate}_${endDate}` : null;

  // 1) Try cache first (instant UI if fresh)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!cacheKey) {
        if (mounted) setCacheChecked(true);
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (!raw) return;
        const cached = JSON.parse(raw) as CachedEnvelope;
        const isFresh = Date.now() - cached.savedAt <= CACHE_TTL_MS;
        if (isFresh && cached.doc && mounted) {
          setDoc(cached.doc);
          setSource('cache');
          setCacheFresh(true);
        }
      } catch {
        // ignore cache errors
      } finally {
        if (mounted) setCacheChecked(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cacheKey, startDate, endDate]);

  // 2) Only read Firestore/compute after cache check, and skip if cache is fresh
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) return;

      // Wait for cache decision
      if (!cacheChecked) return;

      // Skip Firestore when cache is fresh (no billed read)
      if (cacheFresh) {
        if (mounted) setLoading(false);
        return;
      }

      console.log('📅 MonthlyReport: Opening report', { startDate, endDate, userId: user.id });

      try {
        setLoading(true);
        setError(null);

        let existing = await FirebaseService.getMonthlyReport(user.id, startDate, endDate);
        if (existing) {
          if (mounted) {
            setDoc(existing);
            setSource('firestore');
          }
          console.log('📅 MonthlyReport: Loaded from Firestore', {
            startDate,
            endDate,
            daysWithData: existing.daysWithData,
          });

          if (cacheKey) {
            const envelope: CachedEnvelope = { savedAt: Date.now(), doc: existing };
            await AsyncStorage.setItem(cacheKey, JSON.stringify(envelope));
          }
        } else {
          const tz = await FirebaseService.getUserTimezone(user.id);
          const created = await FirebaseService.getOrCreateMonthlyReport(
            user.id,
            startDate,
            endDate,
            tz || undefined
          );
          if (mounted) {
            setDoc(created);
            setSource('computed');
          }
          console.log('🧮 MonthlyReport: Computed and saved', {
            startDate,
            endDate,
            daysWithData: created.daysWithData,
            timezone: tz || 'device',
          });

          if (cacheKey) {
            const envelope: CachedEnvelope = { savedAt: Date.now(), doc: created };
            await AsyncStorage.setItem(cacheKey, JSON.stringify(envelope));
          }
        }
      } catch (e: any) {
        console.log('❌ MonthlyReport: Error', e?.message || e);
        if (mounted) setError('Failed to load monthly report');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, cacheKey, startDate, endDate, cacheFresh, cacheChecked]);

  const handleDownload = async () => {
    try {
      if (!doc?.reportData || !user) {
        Alert.alert('No Data', 'No data available to generate this report.');
        return;
      }
      const dailyCalorieGoal = profile?.goals?.calories ?? undefined;
      console.log('⬇️ MonthlyReport: Generating PDF', { startDate, endDate, source });
      // Reuse weekly PDF generator for now
      await PDFService.generateWeeklyReport(doc.reportData, user.name || 'User', dailyCalorieGoal);
      Alert.alert('Done', 'PDF has been generated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const insufficient = (doc?.daysWithData ?? 0) < MIN_MONTH_DAYS;
  const showSpinner = loading && !doc;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
      <TouchableOpacity onPress={() => router.replace('/(tabs)/stats')} style={styles.backBtn}>
      <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monthly Report</Text>
        <TouchableOpacity onPress={handleDownload} style={styles.dlBtn} disabled={!doc?.reportData || insufficient}>
          <Download size={18} color="#FFFFFF" />
          <Text style={styles.dlTxt}>Download PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Period */}
      <View style={styles.periodRow}>
        <Text style={styles.periodTxt}>
          Month: {startDate} → {endDate}
        </Text>
        {!!doc && (
          <Text style={styles.subtle}>
            {doc.daysWithData} day(s) logged • {source === 'cache' ? 'from Cache' : source === 'firestore' ? 'from Firestore' : source === 'computed' ? 'computed now' : ''}
          </Text>
        )}
      </View>

      {showSpinner ? (
        <View style={styles.loading}><ActivityIndicator /></View>
      ) : error ? (
        <View style={styles.loading}><Text style={{ color: '#ef4444' }}>{error}</Text></View>
      ) : !doc?.reportData ? (
        <View style={styles.loading}><Text style={{ color: '#6b7280' }}>No data for this month.</Text></View>
      ) : insufficient ? (
        <View style={styles.loading}>
          <Text style={{ color: '#6b7280' }}>
            Need at least {MIN_MONTH_DAYS} days logged in this month to view detailed analytics.
          </Text>
        </View>
      ) : (
        <WeeklyReportDisplay
          reportData={doc.reportData}
          userName={user?.name || 'User'}
          dailyCalorieGoal={profile?.goals?.calories}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  dlBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  dlTxt: { color: '#FFFFFF', fontWeight: '600' },
  periodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  periodTxt: { color: '#111827', fontWeight: '600' },
  subtle: { color: '#6B7280', fontSize: 12 },
  loading: { padding: 24, alignItems: 'center' },
});