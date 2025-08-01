import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, Line, G } from 'react-native-svg';
import { line, curveCardinal } from 'd3-shape';
import { scaleTime, scaleLinear } from 'd3-scale';
import { formatDisplayDate } from '@/utils/dateUtils';

interface WeightChartProps {
  data: Array<{
    date: string;
    weight: number;
  }>;
}

export function WeightChart({ data }: WeightChartProps) {
  const chartWidth = 320;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  if (!data || data.length === 0) {
  return (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>No weight data logged yet.</Text>
      <Text style={styles.noDataSubtext}>Log your first weight to see your progress!</Text>
    </View>
  );
}

// Filter to get only the latest entry per day
const getLatestEntryPerDay = (data: Array<{ date: string; weight: number }>) => {
  const grouped = data.reduce((acc, entry) => {
    const dateKey = entry.date.split('T')[0]; // Get YYYY-MM-DD part
    
    if (!acc[dateKey] || new Date(entry.date) > new Date(acc[dateKey].date)) {
      acc[dateKey] = entry;
    }
    
    return acc;
  }, {} as Record<string, { date: string; weight: number }>);
  
  return Object.values(grouped);
};

const filteredData = getLatestEntryPerDay(data);

// Handle single data point
if (filteredData.length === 1) {
const singleLog = filteredData[0];
    return (
      <View style={styles.singleDataContainer}>
        <Text style={styles.singleDataText}>
          Weight: <Text style={styles.singleDataValue}>{singleLog.weight} kg</Text> on {formatShortDate(singleLog.date)}
        </Text>
        <Svg height="50" width="50" style={styles.singleDotSvg}>
          <Circle cx="25" cy="25" r="5" fill="#22C55E" />
        </Svg>
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

  // Create scales
  const xScale = scaleTime()
    .domain([sortedData[0].parsedDate, sortedData[sortedData.length - 1].parsedDate])
    .range([padding.left, chartWidth - padding.right]);

  const weights = sortedData.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight;
  const yPadding = weightRange * 0.1 || 2; // 10% padding or minimum 2kg

  const yScale = scaleLinear()
    .domain([minWeight - yPadding, maxWeight + yPadding])
    .range([chartHeight - padding.bottom, padding.top]);

  // Create line generator
  const lineGenerator = line<typeof sortedData[0]>()
    .x(d => xScale(d.parsedDate))
    .y(d => yScale(d.weight))
    .curve(curveCardinal.tension(0.3)); // Smooth curve

  // Generate path data
  const pathData = lineGenerator(sortedData) || '';

  // Format date for display (e.g., "Jul 1", "Dec 15")
  function formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Calculate which dates to show on X-axis (max 4 labels to avoid crowding)
  const getXAxisLabels = () => {
    if (sortedData.length <= 4) {
      return sortedData;
    }
    
    const step = Math.ceil(sortedData.length / 4);
    const labels = [];
    for (let i = 0; i < sortedData.length; i += step) {
      labels.push(sortedData[i]);
    }
    
    // Always include the last point if it's not already included
    const lastPoint = sortedData[sortedData.length - 1];
    if (labels[labels.length - 1] !== lastPoint) {
      labels.push(lastPoint);
    }
    
    return labels;
  };

  const xAxisLabels = getXAxisLabels();

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>Weight Progress</Text>
      <Svg height={chartHeight} width={chartWidth}>
        {/* Grid lines */}
        {[minWeight, (minWeight + maxWeight) / 2, maxWeight].map((weight, index) => (
          <Line
            key={index}
            x1={padding.left}
            y1={yScale(weight)}
            x2={chartWidth - padding.right}
            y2={yScale(weight)}
            stroke="#F3F4F6"
            strokeWidth="1"
          />
        ))}

        {/* Smooth line */}
        <Path
          d={pathData}
          stroke="#22C55E"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points with weight labels */}
        {sortedData.map((d, i) => (
  <G key={i}>
    <Circle
      cx={xScale(d.parsedDate)}
      cy={yScale(d.weight)}
      r="5"
      fill="#22C55E"
      stroke="#FFFFFF"
      strokeWidth="2"
    />
    <SvgText
      x={xScale(d.parsedDate)}
      y={yScale(d.weight) - 12}
      fontSize="12"
      fill="#111827"
      textAnchor="middle"
      fontWeight="600"
    >
      {d.weight}kg
    </SvgText>
  </G>
))}

        {/* Y-axis labels */}
        <SvgText
          x={padding.left - 10}
          y={yScale(maxWeight)}
          fontSize="11"
          fill="#6B7280"
          textAnchor="end"
          alignmentBaseline="middle"
        >
          {Math.round(maxWeight)}kg
        </SvgText>
        <SvgText
          x={padding.left - 10}
          y={yScale(minWeight)}
          fontSize="11"
          fill="#6B7280"
          textAnchor="end"
          alignmentBaseline="middle"
        >
          {Math.round(minWeight)}kg
        </SvgText>

        {/* X-axis labels */}
        {xAxisLabels.map((d, i) => (
          <SvgText
            key={i}
            x={xScale(d.parsedDate)}
            y={chartHeight - padding.bottom + 20}
            fontSize="11"
            fill="#6B7280"
            textAnchor="middle"
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  noDataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  singleDataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  singleDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  singleDataValue: {
    color: '#22C55E',
    fontWeight: '700',
  },
  singleDotSvg: {
    marginTop: 10,
  },
});