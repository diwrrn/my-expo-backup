import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';

interface MealCardProps {
  title: string;
  calories: number;
  items: number;
  color: string;
  icon: React.ReactNode;
}

export function MealCard({ title, calories, items, color, icon }: MealCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon}
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: color }]}>
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.caloriesContainer}>
          <Text style={styles.caloriesValue}>{calories}</Text>
          <Text style={styles.caloriesLabel}>calories</Text>
        </View>
        
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsText}>
            {items} {items === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  itemsContainer: {
    alignItems: 'flex-end',
  },
  itemsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});