/**
 * User Preferences API Endpoint
 * Manages user preferences for meal planning
 */

import { UserFeedbackService } from '@/services/userFeedbackService';

export async function POST(request: Request) {
  try {
    const { userId, preferences } = await request.json();
    
    // Validate required parameters
    if (!userId || !preferences) {
      return Response.json({
        success: false,
        error: {
          message: 'Missing required parameters',
          details: ['userId and preferences are required']
        }
      }, { status: 400 });
    }
    
    // Save user preferences
    const updatedPreferences = await UserFeedbackService.saveUserPreferences(
      userId,
      preferences
    );
    
    return Response.json({
      success: true,
      preferences: updatedPreferences,
      message: 'Preferences saved successfully'
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    
    return Response.json({
      success: false,
      error: {
        message: 'Failed to save preferences',
        details: error instanceof Error ? [error.message] : ['Unknown error']
      }
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Validate required parameters
    if (!userId) {
      return Response.json({
        success: false,
        error: {
          message: 'Missing required parameters',
          details: ['userId is required']
        }
      }, { status: 400 });
    }
    
    // Get user preferences
    const preferences = await UserFeedbackService.getUserPreferences(userId);
    
    return Response.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    
    return Response.json({
      success: false,
      error: {
        message: 'Failed to get preferences',
        details: error instanceof Error ? [error.message] : ['Unknown error']
      }
    }, { status: 500 });
  }
}