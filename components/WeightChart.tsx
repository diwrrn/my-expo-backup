import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, Line, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { line, curveCardinal, area } from 'd3-shape';
import { scaleTime, scaleLinear } from 'd3-scale';
import { formatDisplayDate } from '@/utils/dateUtils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface WeightChartProps {
  data: Array<{
    date: string;
    weight: number;
  }>;
}

export function WeightChart({ data }: WeightChartProps) {
  const chartWidth = 350;
  const chartHeight = 240;
  const padding = { top: 40, right: 30, bottom: 50, left: 60 };
  
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.chartTitle}>Weight Progress</Text>
          <View style={styles.emptyBadge}>
            <Text style={styles.emptyBadgeText}>No Data</Text>
          </View>
        </View>
        <View style={styles.noDataContainer}>
          <View style={styles.noDataIconContainer}>
            <TrendingUp size={48} color="#E5E7EB" />
          </View>
          <Text style={styles.noDataText}>No weight data logged yet</Text>
          <Text style={styles.noDataSubtext}>Start tracking your weight to see beautiful progress charts!</Text>
        </View>
      </View>
    );
  }

  const getLatestEntryPerDay = (data: Array<{ date: string; weight: number }>) => {
    const grouped = data.reduce((acc, entry) => {
      // Handle both timestamp and date-only formats
      const dateKey = entry.date.includes('T') 
        ? entry.date.split('T')[0]  // Timestamp format: "2025-08-06T10:30:00.000Z"
        : entry.date;               // Date-only format: "2025-08-06"
      
      // If no entry for this date, or if current entry is newer
      if (!acc[dateKey] || new Date(entry.date).getTime() > new Date(acc[dateKey].date).getTime()) {
        acc[dateKey] = entry;
      }
      
      return acc;
    }, {} as Record<string, { date: string; weight: number }>);
    
    // Sort by date to ensure proper order
    return Object.values(grouped).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const filteredData = getLatestEntryPerDay(data);

  // Handle single data point
  if (filteredData.length === 1) {
    const singleLog = filteredData[0];
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.chartTitle}>Weight Progress</Text>
          <View style={styles.singleBadge}>
            <Text style={styles.singleBadgeText}>First Entry</Text>
          </View>
        </View>
        <View style={styles.singleDataContainer}>
          <View style={styles.singleDataCard}>
            <Text style={styles.singleDataLabel}>Current Weight</Text>
            <Text style={styles.singleDataValue}>{singleLog.weight} kg</Text>
            <Text style={styles.singleDataDate}>Logged on {formatShortDate(singleLog.date)}</Text>
          </View>
          <View style={styles.singleDotContainer}>
            <Svg height="60" width="60">
              <Circle cx="30" cy="30" r="8" fill="#10B981" />
              <Circle cx="30" cy="30" r="16" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.3" />
              <Circle cx="30" cy="30" r="24" fill="none" stroke="#10B981" strokeWidth="1" opacity="0.2" />
            </Svg>
          </View>
        </View>
      </View>
    );
  }

  // Parse dates and sort data by date
  const sortedData = [...filteredData]
    .map(d => ({
      ...d,
      parsedDate: new Date(d.date)
    }))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  // Calculate trend
  const firstWeight = sortedData[0].weight;
  const lastWeight = sortedData[sortedData.length - 1].weight;
  const weightChange = lastWeight - firstWeight;
  const weightChangePercent = ((weightChange / firstWeight) * 100).toFixed(1);

  // Create scales
  const xScale = scaleTime()
    .domain([sortedData[0].parsedDate, sortedData[sortedData.length - 1].parsedDate])
    .range([padding.left, chartWidth - padding.right]);

  const weights = sortedData.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight;
  const yPadding = weightRange * 0.15 || 3;

  const yScale = scaleLinear()
    .domain([minWeight - yPadding, maxWeight + yPadding])
    .range([chartHeight - padding.bottom, padding.top]);

  // Create line generator
  const lineGenerator = line<typeof sortedData[0]>()
    .x(d => xScale(d.parsedDate))
    .y(d => yScale(d.weight))
    .curve(curveCardinal.tension(0.3));

  // Create area generator for gradient fill
  const areaGenerator = area<typeof sortedData[0]>()
    .x(d => xScale(d.parsedDate))
    .y0(chartHeight - padding.bottom)
    .y1(d => yScale(d.weight))
    .curve(curveCardinal.tension(0.3));

  const pathData = lineGenerator(sortedData) || '';
  const areaData = areaGenerator(sortedData) || '';

  // Format date for display
  function formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Calculate which dates to show on X-axis
  const getXAxisLabels = () => {
    if (sortedData.length <= 4) {
      return sortedData;
    }
    
    const step = Math.ceil(sortedData.length / 4);
    const labels = [];
    for (let i = 0; i < sortedData.length; i += step) {
      labels.push(sortedData[i]);
    }
    
    const lastPoint = sortedData[sortedData.length - 1];
    if (labels[labels.length - 1] !== lastPoint) {
      labels.push(lastPoint);
    }
    
    return labels;
  };

  const xAxisLabels = getXAxisLabels();

  // Get trend icon and color
  const getTrendInfo = () => {
    if (Math.abs(weightChange) < 0.1) {
      return { icon: Minus, color: '#6B7280', text: 'Stable', sign: '' };
    } else if (weightChange > 0) {
      return { icon: TrendingUp, color: '#EF4444', text: 'Gaining', sign: '+' };
    } else {
      return { icon: TrendingDown, color: '#10B981', text: 'Losing', sign: '' };
    }
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.chartTitle}>Weight Progress</Text>
        <View style={[styles.trendBadge, { backgroundColor: trendInfo.color + '15' }]}>
          <TrendIcon size={12} color={trendInfo.color} />
          <Text style={[styles.trendBadgeText, { color: trendInfo.color }]}>
            {trendInfo.text}
          </Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Change</Text>
          <Text style={[styles.statValue, { color: trendInfo.color }]}>
            {trendInfo.sign}{Math.abs(weightChange).toFixed(1)} kg
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Percentage</Text>
          <Text style={[styles.statValue, { color: trendInfo.color }]}>
            {trendInfo.sign}{Math.abs(parseFloat(weightChangePercent))}%
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Entries</Text>
          <Text style={styles.statValue}>{sortedData.length}</Text>
        </View>
      </View>

      <Svg height={chartHeight} width={chartWidth} style={styles.chart}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
          </LinearGradient>
          <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#059669" />
            <Stop offset="50%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#34D399" />
          </LinearGradient>
        </Defs>

        {/* Background grid */}
        {[minWeight, (minWeight + maxWeight) / 2, maxWeight].map((weight, index) => (
          <Line
            key={index}
            x1={padding.left}
            y1={yScale(weight)}
            x2={chartWidth - padding.right}
            y2={yScale(weight)}
            stroke="#F3F4F6"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}

        {/* Area fill */}
        <Path
          d={areaData}
          fill="url(#areaGradient)"
        />

        {/* Main line */}
        <Path
          d={pathData}
          stroke="url(#lineGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {sortedData.map((d, i) => (
          <G key={i}>
            <Circle
              cx={xScale(d.parsedDate)}
              cy={yScale(d.weight)}
              r="8"
              fill="#FFFFFF"
              stroke="#10B981"
              strokeWidth="3"
            />
            <Circle
              cx={xScale(d.parsedDate)}
              cy={yScale(d.weight)}
              r="4"
              fill="#10B981"
            />
            
            {/* Weight labels with background */}
            <Rect
              x={xScale(d.parsedDate) - 18}
              y={yScale(d.weight) - 26}
              width="36"
              height="16"
              fill="#374151"
              rx="8"
              opacity="0.8"
            />
            <SvgText
              x={xScale(d.parsedDate)}
              y={yScale(d.weight) - 16}
              fontSize="10"
              fill="#F9FAFB"
              textAnchor="middle"
              fontWeight="500"
            >
              {d.weight}kg
            </SvgText>
          </G>
        ))}

        {/* Y-axis labels */}
        <SvgText
          x={padding.left - 15}
          y={yScale(maxWeight)}
          fontSize="12"
          fill="#6B7280"
          textAnchor="end"
          alignmentBaseline="middle"
          fontWeight="500"
        >
          {Math.round(maxWeight)}kg
        </SvgText>
        <SvgText
          x={padding.left - 15}
          y={yScale(minWeight)}
          fontSize="12"
          fill="#6B7280"
          textAnchor="end"
          alignmentBaseline="middle"
          fontWeight="500"
        >
          {Math.round(minWeight)}kg
        </SvgText>

        {/* X-axis labels */}
        {xAxisLabels.map((d, i) => (
          <SvgText
            key={i}
            x={xScale(d.parsedDate)}
            y={chartHeight - padding.bottom + 25}
            fontSize="12"
            fill="#6B7280"
            textAnchor="middle"
            fontWeight="500"
          >
            {formatShortDate(d.date)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  emptyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  singleBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  singleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  chart: {
    alignSelf: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    paddingVertical: 20,
  },
  noDataIconContainer: {
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  singleDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    paddingVertical: 20,
  },
  singleDataCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minWidth: 200,
  },
  singleDataLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
  },
  singleDataValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  singleDataDate: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  singleDotContainer: {
    alignItems: 'center',
  },
});