/**
 * Feedback API Index Endpoint
 * Provides documentation for all feedback API endpoints
 */

export async function GET(request: Request) {
  return Response.json({
    success: true,
    name: 'Feedback API',
    version: '1.0.0',
    description: 'API for collecting and analyzing user feedback',
    endpoints: [
      {
        path: '/api/feedback/meal-plan',
        methods: ['POST', 'GET'],
        description: 'Submit and retrieve meal plan feedback',
        documentation: '/api/feedback/meal-plan'
      },
      {
        path: '/api/feedback/food-combination',
        methods: ['POST', 'GET'],
        description: 'Submit and retrieve food combination feedback',
        documentation: '/api/feedback/food-combination'
      },
      {
        path: '/api/feedback/ai-metrics',
        methods: ['POST', 'GET'],
        description: 'Log and retrieve AI response metrics',
        documentation: '/api/feedback/ai-metrics'
      },
      {
        path: '/api/feedback/preferences',
        methods: ['POST', 'GET'],
        description: 'Manage user preferences for meal planning',
        documentation: '/api/feedback/preferences'
      }
    ],
    usage: {
      authentication: 'All endpoints require authentication via Authorization header',
      rateLimit: '100 requests per minute',
      documentation: 'GET request to any endpoint returns its documentation'
    }
  });
}