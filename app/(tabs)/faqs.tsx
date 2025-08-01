import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';

// Accordion component for smooth expand/collapse
function AccordionItem({ isExpanded, children, viewKey, style, duration = 300, disableAnimation = false }) {
  const height = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => {
    if (disableAnimation) {
      return {
        height: 'auto',
        overflow: 'visible',
      };
    }
    return {
      height: withTiming(isExpanded ? height.value : 0, { duration }),
      overflow: 'hidden',
    };
  });
  
  return (
    <Animated.View key={`accordionItem_${viewKey}`} style={[animatedStyle, style]}>
      <View 
        onLayout={(e) => {
          const measuredHeight = e.nativeEvent.layout.height;
          if (measuredHeight > 0 && !disableAnimation) {
            height.value = measuredHeight;
          }
        }}
        style={!disableAnimation ? { position: 'absolute', width: '100%' } : {}}
      >
        {children}
      </View>
    </Animated.View>
  );
}
interface FAQItem {
  id: string;
  title: string;
  content: string | FAQItem[];
}

// Define the structure for FAQ data
interface FAQItem {
  id: string;
  title: string;
  content: string | FAQItem[];
}

// Reusable FAQCard component
interface FAQCardProps {
  item: FAQItem;
  level: number;
}

const FAQCard: React.FC<FAQCardProps> = ({ item, level }) => {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getBackgroundColor = () => {
    switch (level) {
      case 0: return '#F0FDF4';
      case 1: return '#F9FAFB';
      default: return '#FFFFFF';
    }
  };

  const getTitleStyle = () => {
    const baseSize = 18;
    const fontSize = Math.max(14, baseSize - (level * 2));
    
    return {
      fontSize,
      fontWeight: level === 0 ? '700' : level === 1 ? '600' : '500',
      color: level === 0 ? '#111827' : level === 1 ? '#374151' : '#6B7280',
      textAlign: getTextAlign(isRTL),
    };
  };

  // For level 0 (main topics), no individual container - they're all in one unified container
  if (level === 0) {
    return (
      <View>
        <TouchableOpacity
          onPress={toggleExpand}
          style={[
            styles.mainTopicHeader,
            {
              backgroundColor: getBackgroundColor(),
              flexDirection: getFlexDirection(isRTL),
            }
          ]}
          activeOpacity={0.7}
        >
          <Text style={[getTitleStyle(), { flex: 1 }]}>
            {item.title}
          </Text>
          {isExpanded ? (
            <ChevronUp 
              size={20} 
              color="#6B7280" 
              style={{
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
              }} 
            />
          ) : (
            <ChevronDown 
              size={20} 
              color="#6B7280" 
              style={{
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
              }} 
            />
          )}
        </TouchableOpacity>

        <AccordionItem isExpanded={isExpanded} viewKey={item.id} duration={300} disableAnimation={isExpanded}>
          <View style={styles.mainTopicContent}>
            {typeof item.content === 'string' ? (
              <Text style={[styles.answerText, { textAlign: getTextAlign(isRTL) }]}>
                {item.content}
              </Text>
            ) : (
              item.content.map((subItem, index) => (
                <View key={subItem.id} style={[
                  styles.subItemContainer,
                  index < item.content.length - 1 && styles.subItemBorder
                ]}>
                  <FAQCard item={subItem} level={level + 1} />
                </View>
              ))
            )}
          </View>
        </AccordionItem>
      </View>
    );
  }

  // For nested items (level 1+), no individual borders
  return (
    <View>
      <TouchableOpacity
        onPress={toggleExpand}
        style={[
          styles.nestedHeader,
          {
            backgroundColor: getBackgroundColor(),
            paddingLeft: level * 16,
            flexDirection: getFlexDirection(isRTL),
          }
        ]}
        activeOpacity={0.7}
      >
        <Text style={[getTitleStyle(), { flex: 1 }]}>
          {item.title}
        </Text>
        {isExpanded ? (
          <ChevronUp 
            size={20} 
            color="#6B7280" 
            style={{
              marginLeft: isRTL ? 0 : 8,
              marginRight: isRTL ? 8 : 0,
            }} 
          />
        ) : (
          <ChevronDown 
            size={20} 
            color="#6B7280" 
            style={{
              marginLeft: isRTL ? 0 : 8,
              marginRight: isRTL ? 8 : 0,
            }} 
          />
        )}
      </TouchableOpacity>

      <AccordionItem isExpanded={isExpanded} viewKey={item.id} duration={500}>
        <View style={[
          styles.contentContainer,
          { paddingLeft: level * 16 }
        ]}>
          {typeof item.content === 'string' ? (
            <Text style={[styles.answerText, { textAlign: getTextAlign(isRTL) }]}>
              {item.content}
            </Text>
          ) : (
            item.content.map((subItem) => (
              <FAQCard key={subItem.id} item={subItem} level={level + 1} />
            ))
          )}
        </View>
      </AccordionItem>
    </View>
  );
};

export default function FAQsScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();

  // Sample FAQ Data
  const faqData: FAQItem[] = [
    {
      id: 'calorie',
      title: t('faq:calorieTitle', 'Calorie Tracking'),
      content: [
        {
          id: 'calorie1',
          title: t('faq:calorieQ1', 'How do I set my daily calorie goal?'),
          content: t('faq:calorieA1', 'Your daily calorie goal can be set in the "Calculator" section based on your personal information and activity level. You can also manually adjust it in "Daily Goals" or "Personal Info" in settings.'),
        },
        {
          id: 'calorie2',
          title: t('faq:calorieQ2', 'How accurate are the calorie counts?'),
          content: t('faq:calorieA2', 'Calorie counts are based on standard nutritional databases. While generally accurate, slight variations may occur due to food preparation methods or specific product differences.'),
        },
        {
          id: 'calorie3',
          title: t('faq:calorieQ3', 'Can I track calories for custom foods?'),
          content: t('faq:calorieA3', 'Yes, you can add custom foods with their nutritional information in the "Add Food" screen. This allows you to track homemade meals or unique products not found in our database.'),
        },
      ],
    },
    {
      id: 'workout',
      title: t('faq:workoutTitle', 'Workout Tracking'),
      content: [
        {
          id: 'workout1',
          title: t('faq:workoutQ1', 'How do I create a new workout plan?'),
          content: t('faq:workoutA1', 'You can create a new workout plan from the "Workout" tab. Select "My Workout Plans" and then tap the "+" button to start building your custom routine by adding exercises.'),
        },
        {
          id: 'workout2',
          title: t('faq:workoutQ2', 'Can I add custom exercises?'),
          content: t('faq:workoutA2', 'Currently, you can only select from the predefined exercise database. We are working on adding functionality for custom exercise creation in future updates.'),
        },
      ],
    },
    {
      id: 'calculator',
      title: t('faq:calculatorTitle', 'Calculator'),
      content: [
        {
          id: 'calculator1',
          title: t('faq:calculatorQ1', 'What is BMR and TDEE?'),
          content: t('faq:calculatorA1', 'BMR (Basal Metabolic Rate) is the calories your body burns at rest. TDEE (Total Daily Energy Expenditure) is the total calories you burn in a day, including activity.'),
        },
      ],
    },
    {
      id: 'others',
      title: t('faq:othersTitle', 'Other Questions'),
      content: [
        {
          id: 'others1',
          title: t('faq:othersQ1', 'How do I change the app language?'),
          content: t('faq:othersA1', 'You can change the app language in the "Settings" screen under the "Language" option.'),
        },
        {
          id: 'others2',
          title: t('faq:othersQ2', 'Is my data synced across devices?'),
          content: t('faq:othersA2', 'Yes, your data is stored securely in the cloud and synced across all devices.'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          {isRTL ? (
            <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
          ) : (
            <ArrowLeft size={24} color="#111827" />
          )}
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { textAlign: getTextAlign(isRTL) }]}>
            {t('common:helpSupport', 'Help & Support')}
          </Text>
          <Text style={[styles.headerSubtitle, { textAlign: getTextAlign(isRTL) }]}>
            {t('common:helpSupportSubtitle', 'Frequently Asked Questions')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          <View style={styles.faqContainer}>
            {faqData.map((item, index) => (
              <View key={item.id} style={[
                index < faqData.length - 1 && styles.topicDivider
              ]}>
                <FAQCard item={item} level={0} />
              </View>
            ))}
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 24,
    paddingBottom: 90,
  },
  // Accordion wrapper for measuring content height
  accordionWrapper: {
    // Remove position absolute - it causes layout issues
  },
  // Unified container for all FAQ items
  faqContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  // Divider between main topics
  topicDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  // Main topic headers (level 0)
  mainTopicHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  mainTopicContent: {
    backgroundColor: '#FFFFFF',
  },
  // Individual topic container (REMOVED - no longer needed)
  // Sub-item containers within each topic
  subItemContainer: {
    backgroundColor: '#FFFFFF',
  },
  subItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  // Nested headers (level 1+) - no individual borders
  nestedHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingRight: 16,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});