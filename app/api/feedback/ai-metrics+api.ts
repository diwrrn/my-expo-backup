/**
 * AI Metrics Feedback API Endpoint
 * Logs and retrieves AI response metrics
 */

import { UserFeedbackService } from '@/services/userFeedbackService';

export async function POST(request: Request) {
  try {
    const {
      userId,
      mealPlanId,
      promptId,
      calorieAccuracy,
      proteinAccuracy,
      generationTime,
      retryCount,
      success,
      errorType
    } = await request.json();
    
    // Validate required parameters
    if (!userId || !mealPlanId || !promptId || calorieAccuracy === undefined || 
        proteinAccuracy === undefined || generationTime === undefined || 
        retryCount === undefined || success === undefined) {
      return Response.json({
        success: false,
        error: {
          message: 'Missing required parameters',
          details: ['userId, mealPlanId, promptId, calorieAccuracy, proteinAccuracy, generationTime, retryCount, and success are required']
        }
      }, { status: 400 });
    }
    
    // Log AI response metrics
    const feedbackId = await UserFeedbackService.logAIResponseFeedback(
      userId,
      mealPlanId,
      promptId,
      calorieAccuracy,
      proteinAccuracy,
      generationTime,
      retryCount,
      success,
      errorType
    );
    
    return Response.json({
      success: true,
      feedbackId,
      message: 'AI metrics logged successfully'
    });
  } catch (error) {
    console.error('Error logging AI metrics:', error);
    
    return Response.json({
      success: false,
      error: {
        message: 'Failed to log AI metrics',
        details: error instanceof Error ? [error.message] : ['Unknown error']
      }
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Get AI response stats
    const stats = await UserFeedbackService.getAIResponseStats();
    
    return Response.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting AI response stats:', error);
    
    return Response.json({
      success: false,
      error: {
        message: 'Failed to get AI response stats',
        details: error instanceof Error ? [error.message] : ['Unknown error']
      }
    }, { status: 500 });
  }
}