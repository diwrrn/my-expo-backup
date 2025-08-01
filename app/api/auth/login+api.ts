export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Replace with actual authentication logic
    // This is a mock implementation
    if (email === 'demo@example.com' && password === 'password') {
      const user = {
        id: '1',
        email: 'demo@example.com',
        name: 'Demo User',
        profile: {
          weight: 75,
          height: 180,
          age: 28,
          activityLevel: 'moderate',
          goals: {
            calories: 2100,
            protein: 105,
            carbs: 262,
            fat: 70,
          },
        },
      };

      // TODO: Generate actual JWT token
      const token = 'mock-jwt-token';

      return Response.json({
        success: true,
        user,
        token,
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid credentials' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}