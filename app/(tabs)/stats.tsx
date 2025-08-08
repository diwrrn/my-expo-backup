import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, TrendingUp, Calendar } from 'lucide-react-native';
import { useState, useEffect } from 'react';

import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useWeeklyStats } from '@/hooks/useWeeklyStats';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';
import { PDFService } from '@/services/pdfService';
import { WeeklyReportDisplay } from '@/components/WeeklyReportDisplay';
import { useProfileContext } from '@/contexts/ProfileContext';

export default function StatsScreen() {
  const { user } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { profile } = useProfileContext();
  
  // Get current week dates
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() - 1); // Yesterday
  const startOfWeek = new Date(endOfWeek);
  startOfWeek.setDate(endOfWeek.getDate() - 6); // 7 days ago
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];

  const { weeklyStats, loading, error } = useWeeklyStats(startDate, endDate);

  const generatePDFReport = async () => {
    if (!weeklyStats || !user) {
      Alert.alert('No Data', 'No weekly data available to generate report');
      return;
    }

    try {
      setIsGenerating(true);
      console.log('📄 Generating PDF report...');
      const filteredReportData = FirebaseService.filterWeeklyStatsForReport(weeklyStats);

      // Set the report data for display
      setReportData(filteredReportData);
      setShowReport(true);
      
      // Get the daily calorie goal from user profile
      const dailyCalorieGoal = profile?.goals?.calories || null;

      // Generate PDF with calorie goal
      await PDFService.generateWeeklyReport(
        filteredReportData, 
        user.name || 'User',
        dailyCalorieGoal
      );
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Show report display if report is generated
  if (showReport && reportData) {
    return (
      <WeeklyReportDisplay 
        reportData={reportData} 
        userName={user?.name || 'User'} 
        dailyCalorieGoal={profile?.goals?.calories}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <HamburgerMenu currentRoute="/(tabs)/stats" />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Statistics</Text>
              <Text style={styles.headerSubtitle}>Track your nutrition journey</Text>
            </View>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeIconContainer}>
            <TrendingUp size={48} color="#22C55E" />
          </View>
          <Text style={styles.welcomeTitle}>Get Your Weekly & Monthly Statistics Here!</Text>
          <Text style={styles.welcomeText}>
            Generate comprehensive reports to track your nutrition progress, 
            analyze your eating patterns, and stay motivated on your health journey.
          </Text>
        </View>

        {/* Weekly Report Section */}
        <View style={styles.reportSection}>
          <View style={styles.reportHeader}>
            <Calendar size={24} color="#22C55E" />
            <Text style={styles.reportTitle}>Weekly Report</Text>
          </View>
          <Text style={styles.reportDescription}>
            Generate a detailed PDF report of your nutrition data for the past week, 
            including calorie intake, macronutrients, and eating patterns.
          </Text>
          
          <TouchableOpacity 
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={generatePDFReport}
            disabled={isGenerating || loading}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <FileText size={20} color="#FFFFFF" />
            )}
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate Weekly Report'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What's Included in Your Report?</Text>
          <View style={styles.infoItems}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <TrendingUp size={16} color="#22C55E" />
              </View>
              <Text style={styles.infoText}>Daily calorie intake trends</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <TrendingUp size={16} color="#22C55E" />
              </View>
              <Text style={styles.infoText}>Macronutrient breakdown</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <TrendingUp size={16} color="#22C55E" />
              </View>
              <Text style={styles.infoText}>Food category analysis</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <TrendingUp size={16} color="#22C55E" />
              </View>
              <Text style={styles.infoText}>Weekly averages and insights</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  reportSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoItems: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});