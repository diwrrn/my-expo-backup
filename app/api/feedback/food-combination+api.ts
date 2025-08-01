/**
 * Food Combination Feedback API Endpoint
 * Handles user feedback for food combinations
 */

import { UserFeedbackService } from '@/services/userFeedbackService';

export async function POST(request: Request) {
  try {
    const { userId, mealType, foods, rating } = await request.json();
    
    // Validate required parameters
    if (!userId || !mealType || !foods || rating === undefined) {
      return Response.json({
        success: false,
        error: {
          message: 'Missing required parameters',
          details: ['userId, mealType, foods, and rating are required']
        }
      }, { status: 400 });
    }
    
    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    if (!validMealTypes.includes(mealType)) {
      return Response.json({
        success: false,
        error: {
          message: 'Invalid meal type',
          details: [`mealType must be one of: ${validMealTypes.join(', ')}`]
        }
      }, { status: 400 });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return Response.json({
        success: false,
        error: {
          message: 'Invalid rating',
          details: ['Rating must be between 1 and 5']
        }
      }, { status: 400 });
    }
    
    // Validate foods
    if (!Array.isArray(foods) || foods.length === 0) {
      return Response.json({
        success: false,
        error: {
          message: 'Invalid foods',
          details: ['foods must be a non-empty array']
        }
      }, { status: 400 });
    }
    
    // Log food combination feedback
    const feedbackId = await UserFeedbackService.logFoodCombinationFeedback(
      userId,
      mealType,
      foods,
      rating
    );
    
    return Response.json({
      success: true,
      feedbackId,
      message: 'Food combination feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting food combination feedback:', error);
    
    return Response.json({
      success: false,
      error: {
        message: 'Failed to submit feedback',
        details: error instanceof Error ? [error.message] : ['Unknown error']
      }
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mealType = url.searchParams.get('mealType');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    
    // Validate meal type if provided
    if (mealType) {
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
      if (!validMealTypes.includes(mealType)) {
        return Response.json({
          success: false,
          error: {
            message: 'Invalid meal type',
            details: [`mealType must be one of: ${validMealTypes.join(', ')}`]
          }
        }, { status: 400 });
      }
    }
    
    // Get popular food combinations
    const combinations = await UserFeedbackService.getPopularFoodCombinations(
      mealType as any || 'breakfast',
      limit
    );
    
    return Response.json({
      success: true,
      combinations
    });
  } catch (error) {
    console.error('Error getting popular food combinations:', error);
    
    return Response.json({
      success: false,
      error: {
        message: 'Failed to get popular food combinations',
        details: error instanceof Error ? [error.message] : ['Unknown error']
      }
    }, { status: 500 });
  }
}