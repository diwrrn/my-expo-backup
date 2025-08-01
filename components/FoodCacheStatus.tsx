import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw, Database, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react-native';

interface FoodCacheStatusProps {
  isLoading: boolean;
  error: string | null;
  foodCount: number;
  lastUpdated: number;
  onRefresh: () => void;
  isCacheExpired: boolean;
}

export function FoodCacheStatus({
  isLoading,
  error,
  foodCount,
  lastUpdated,
  onRefresh,
  isCacheExpired,
}: FoodCacheStatusProps) {
  const getStatusColor = () => {
    if (error) return '#EF4444';
    if (isCacheExpired) return '#F59E0B';
    return '#22C55E';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle size={16} color="#EF4444" />;
    if (isCacheExpired) return <AlertCircle size={16} color="#F59E0B" />;
    return <CheckCircle size={16} color="#22C55E" />;
  };

  const getStatusText = () => {
    if (error) return 'Cache Error';
    if (isCacheExpired) return 'Cache Expired';
    return 'Cache Updated';
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = Date.now();
    const diff = now - lastUpdated;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={[styles.container, { borderColor: getStatusColor() }]}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
          onPress={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw 
            size={16} 
            color={isLoading ? "#9CA3AF" : "#6B7280"}
            style={isLoading ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Database size={14} color="#6B7280" />
          <Text style={styles.detailText}>{foodCount} foods</Text>
        </View>
        
        <Text style={styles.lastUpdated}>
          Updated {formatLastUpdated()}
        </Text>
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {foodCount === 0 && !isLoading && !error && (
        <Text style={styles.infoText}>
          No foods in cache. Tap refresh to load foods from database.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 4,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  spinning: {
    // Add rotation animation if needed
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});