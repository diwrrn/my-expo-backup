import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function SettingsItem({ icon, title, subtitle, onPress }: SettingsItemProps) {
  const isRTL = useRTL();

  return (
    <TouchableOpacity style={[styles.container, { flexDirection: getFlexDirection(isRTL) }]} onPress={onPress}>
      <View style={[styles.iconContainer, { marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }]}>
        {icon}
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign: getTextAlign(isRTL) }]}>{title}</Text>
        <Text style={[styles.subtitle, { textAlign: getTextAlign(isRTL) }]}>{subtitle}</Text>
      </View>
      
      {isRTL ? <ChevronRight size={20} color="#6B7280" style={{ transform: [{ rotate: '180deg' }] }} /> : <ChevronRight size={20} color="#6B7280" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});