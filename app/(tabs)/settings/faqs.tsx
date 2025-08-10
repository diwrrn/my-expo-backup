import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, MessageCircle, X, Phone, Mail, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

// Modern Accordion with smooth animations
function ModernAccordion({ isExpanded, children, viewKey, duration = 400 }) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(isExpanded ? height.value : 0, {
        damping: 15,
        stiffness: 150,
      }),
      opacity: withTiming(isExpanded ? 1 : 0, { duration: duration - 100 }),
      overflow: 'hidden',
    };
  });
  
  return (
    <Animated.View key={`accordion_${viewKey}`} style={animatedStyle}>
      <View 
        onLayout={(e) => {
          const measuredHeight = e.nativeEvent.layout.height;
          if (measuredHeight > 0) {
            height.value = measuredHeight;
          }
        }}
        style={{ position: 'absolute', width: '100%' }}
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
  icon?: string;
}

// Beautiful FAQ Card with press animations
interface FAQCardProps {
  item: FAQItem;
  level: number;
}

const BeautifulFAQCard: React.FC<FAQCardProps> = ({ item, level }) => {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Press animation
  const pressAnimation = useSharedValue(0);
  
  const pressStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      pressAnimation.value,
      [0, 1],
      [level === 0 ? '#FFFFFF' : '#FAFAFA', level === 0 ? '#F8FAFC' : '#F1F5F9']
    );
    
    return {
      backgroundColor,
      transform: [{ scale: withSpring(1 - pressAnimation.value * 0.02) }],
    };
  });

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handlePressIn = () => {
    pressAnimation.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    pressAnimation.value = withTiming(0, { duration: 200 });
  };

  const getCategoryIcon = () => {
    switch (item.id.split(/[0-9]/)[0]) {
      case 'calorie': return '🔥';
      case 'workout': return '💪';
      case 'calculator': return '📊';
      case 'others': return '💡';
      default: return '❓';
    }
  };

  // Main topic card (level 0)
  if (level === 0) {
    return (
      <View style={styles.mainTopicCard}>
        <Animated.View style={pressStyle}>
          <TouchableOpacity
            onPress={toggleExpand}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.mainTopicHeader}
            activeOpacity={1}
          >
            <View style={styles.mainTopicLeft}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>{getCategoryIcon()}</Text>
              </View>
              <View style={styles.mainTopicTextContainer}>
                <Text style={styles.mainTopicTitle}>{item.title}</Text>
                <Text style={styles.mainTopicSubtitle}>
                  {Array.isArray(item.content) ? `${item.content.length} questions` : '1 question'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.chevronContainer, isExpanded && styles.chevronExpanded]}>
              <ChevronDown size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <ModernAccordion isExpanded={isExpanded} viewKey={item.id}>
          <View style={styles.mainTopicContent}>
            {typeof item.content === 'string' ? (
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{item.content}</Text>
              </View>
            ) : (
              item.content.map((subItem, index) => (
                <View key={subItem.id}>
                  <BeautifulFAQCard item={subItem} level={level + 1} />
                  {index < item.content.length - 1 && <View style={styles.subItemDivider} />}
                </View>
              ))
            )}
          </View>
        </ModernAccordion>
      </View>
    );
  }

  // Sub-item card (level 1+)
  return (
    <View style={styles.subItemCard}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          onPress={toggleExpand}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.subItemHeader, { paddingLeft: 16 + (level - 1) * 12 }]}
          activeOpacity={1}
        >
          <View style={styles.questionIndicator} />
          <Text style={styles.subItemTitle}>{item.title}</Text>
          <View style={[styles.miniChevron, isExpanded && styles.miniChevronExpanded]}>
            <ChevronDown size={16} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ModernAccordion isExpanded={isExpanded} viewKey={item.id}>
        <View style={[styles.subItemContent, { paddingLeft: 32 + (level - 1) * 12 }]}>
          {typeof item.content === 'string' ? (
            <View style={styles.answerContainer}>
              <Text style={styles.subAnswerText}>{item.content}</Text>
            </View>
          ) : (
            item.content.map((subSubItem) => (
              <BeautifulFAQCard key={subSubItem.id} item={subSubItem} level={level + 1} />
            ))
          )}
        </View>
      </ModernAccordion>
    </View>
  );
};

export default function BeautifulFAQScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [showContactModal, setShowContactModal] = useState(false);

  const openWhatsApp = () => {
    const phoneNumber = '+9647511871210';
    const message = 'Hello, I need help with the Juula app.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web WhatsApp
      Linking.openURL(`https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`);
    });
  };

  const openInstagram = () => {
    const username = 'juula.app';
    Linking.openURL(`instagram://user?username=${username}`).catch(() => {
      // Fallback to web Instagram
      Linking.openURL(`https://instagram.com/${username}`);
    });
  };

  const openEmail = () => {
    const email = 'support@juulaapp.com';
    const subject = 'Support Request - Juula App';
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`);
  };

  // Enhanced FAQ Data with better structure
  const faqData: FAQItem[] = [
    {
      id: 'calorie',
      title: 'Calorie Tracking',
      content: [
        {
          id: 'calorie1',
          title: 'How do I set my daily calorie goal?',
          content: 'Your daily calorie goal can be set in the "Calculator" section based on your personal information and activity level. You can also manually adjust it in "Daily Goals" or "Personal Info" in settings.',
        },
        {
          id: 'calorie2',
          title: 'How accurate are the calorie counts?',
          content: 'Calorie counts are based on standard nutritional databases. While generally accurate, slight variations may occur due to food preparation methods or specific product differences.',
        },
        {
          id: 'calorie3',
          title: 'Can I track calories for custom foods?',
          content: 'Yes, you can add custom foods with their nutritional information in the "Add Food" screen. This allows you to track homemade meals or unique products not found in our database.',
        },
      ],
    },
    {
      id: 'workout',
      title: 'Workout Tracking',
      content: [
        {
          id: 'workout1',
          title: 'How do I create a new workout plan?',
          content: 'You can create a new workout plan from the "Workout" tab. Select "My Workout Plans" and then tap the "+" button to start building your custom routine by adding exercises.',
        },
        {
          id: 'workout2',
          title: 'Can I add custom exercises?',
          content: 'Currently, you can only select from the predefined exercise database. We are working on adding functionality for custom exercise creation in future updates.',
        },
      ],
    },
    {
      id: 'calculator',
      title: 'Calculator',
      content: [
        {
          id: 'calculator1',
          title: 'What is BMR and TDEE?',
          content: 'BMR (Basal Metabolic Rate) is the calories your body burns at rest. TDEE (Total Daily Energy Expenditure) is the total calories you burn in a day, including activity.',
        },
      ],
    },
    {
      id: 'others',
      title: 'Other Questions',
      content: [
        {
          id: 'others1',
          title: 'How do I change the app language?',
          content: 'You can change the app language in the "Settings" screen under the "Language" option.',
        },
        {
          id: 'others2',
          title: 'Is my data synced across devices?',
          content: 'Yes, your data is stored securely in the cloud and synced across all devices.',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
        </View>

        <View style={styles.helpIconContainer}>
          <HelpCircle size={24} color="#22C55E" />
        </View>
      </View>

      {/* Search Bar Placeholder */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MessageCircle size={20} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search for help...</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.faqList}>
          {faqData.map((item, index) => (
            <View key={item.id} style={index < faqData.length - 1 ? styles.cardSpacing : {}}>
              <BeautifulFAQCard item={item} level={0} />
            </View>
          ))}
        </View>

        {/* Contact Support Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSubtitle}>Get in touch with our support team</Text>
          </View>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => setShowContactModal(true)}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Contact Support Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Support</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowContactModal(false)}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Contact Options */}
            <View style={styles.contactOptions}>
              {/* WhatsApp */}
              <TouchableOpacity style={styles.contactOption} onPress={openWhatsApp}>
                <View style={[styles.contactIconContainer, { backgroundColor: '#25D366' }]}>
                  <MessageSquare size={24} color="#FFFFFF" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactMethodTitle}>WhatsApp</Text>
                  <Text style={styles.contactMethodSubtitle}>+964 751 187 1210</Text>
                </View>
                <ChevronDown size={20} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>

              {/* Instagram */}
              <TouchableOpacity style={styles.contactOption} onPress={openInstagram}>
                <View style={[styles.contactIconContainer, { backgroundColor: '#E4405F' }]}>
                  <View style={styles.instagramIcon}>
                    <Text style={styles.instagramIconText}>📷</Text>
                  </View>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactMethodTitle}>Instagram</Text>
                  <Text style={styles.contactMethodSubtitle}>@juula.app</Text>
                </View>
                <ChevronDown size={20} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>

              {/* Email */}
              <TouchableOpacity style={styles.contactOption} onPress={openEmail}>
                <View style={[styles.contactIconContainer, { backgroundColor: '#3B82F6' }]}>
                  <Mail size={24} color="#FFFFFF" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactMethodTitle}>Email</Text>
                  <Text style={styles.contactMethodSubtitle}>support@juulaapp.com</Text>
                </View>
                <ChevronDown size={20} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>We typically respond within 24 hours</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  helpIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // FAQ List
  faqList: {
    marginTop: 8,
  },
  cardSpacing: {
    marginBottom: 16,
  },

  // Main Topic Card (Level 0)
  mainTopicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  mainTopicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  mainTopicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  mainTopicTextContainer: {
    flex: 1,
  },
  mainTopicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  mainTopicSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    backgroundColor: '#22C55E',
    transform: [{ rotate: '180deg' }],
  },
  mainTopicContent: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  // Sub Item Card (Level 1+)
  subItemCard: {
    backgroundColor: 'transparent',
  },
  subItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 20,
  },
  questionIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 12,
  },
  subItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 22,
  },
  miniChevron: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '0deg' }],
  },
  miniChevronExpanded: {
    backgroundColor: '#E2E8F0',
    transform: [{ rotate: '180deg' }],
  },
  subItemContent: {
    paddingRight: 20,
    paddingBottom: 8,
  },
  subItemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 20,
    marginRight: 20,
  },

  // Answer Styles
  answerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  answerText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    fontWeight: '400',
  },
  subAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '400',
  },

  // Contact Support Card
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Contact Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactOptions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  instagramIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramIconText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  contactMethodSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  modalFooterText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});