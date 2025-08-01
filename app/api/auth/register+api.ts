export async function POST(request: Request) {
  try {
    const { email, password, name, profile } = await request.json();

    // Basic validation
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and name are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Password validation
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Check if user already exists
    // TODO: Hash password
    // TODO: Save to database

    const user = {
      id: Date.now().toString(),
      email,
      name,
      profile: {
        weight: profile?.weight || 70,
        height: profile?.height || 170,
        age: profile?.age || 25,
        activityLevel: profile?.activityLevel || 'moderate',
        goals: {
          calories: profile?.goals?.calories || 2000,
          protein: profile?.goals?.protein || 100,
          carbs: profile?.goals?.carbs || 250,
          fat: profile?.goals?.fat || 65,
        },
      },
      createdAt: new Date().toISOString(),
    };

    // TODO: Generate actual JWT token
    const token = 'mock-jwt-token';

    return Response.json({
      success: true,
      user,
      token,
    });
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