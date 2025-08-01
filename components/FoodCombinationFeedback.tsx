import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react-native';
import { Food } from '@/types/api';
import { useUserFeedback } from '../hooks/useUserFeedback';

interface FoodCombinationFeedbackProps {
  foods: Food[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

export function FoodCombinationFeedback({ foods, mealType }: FoodCombinationFeedbackProps) {
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const { submitFoodCombinationFeedback, isSubmitting } = useUserFeedback();

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      const result = await submitFoodCombinationFeedback(
        mealType,
        foods,
        rating
      );

      if (result) {
        Alert.alert('Success', 'Thank you for your feedback!');
        setShowRating(false);
        setRating(0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  if (foods.length === 0) return null;

  return (
    <View style={styles.container}>
      {!showRating ? (
        <TouchableOpacity 
          style={styles.rateButton}
          onPress={() => setShowRating(true)}
        >
          <ThumbsUp size={16} color="#6B7280" />
          <Text style={styles.rateButtonText}>Rate this combination</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How do you like this food combination?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Star
                  size={24}
                  color={star <= rating ? '#F59E0B' : '#E5E7EB'}
                  fill={star <= rating ? '#F59E0B' : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.ratingActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowRating(false);
                setRating(0);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitRating}
              disabled={isSubmitting || rating === 0}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  rateButtonText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  ratingContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  ratingActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});