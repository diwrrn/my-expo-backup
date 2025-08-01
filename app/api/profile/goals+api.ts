export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId'); // TODO: Get from auth token

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mock user goals - replace with actual database query
    const goals = {
      calories: 2100,
      protein: 105,
      carbs: 262,
      fat: 70,
      water: 2.5,
      updatedAt: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      goals,
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

export async function PUT(request: Request) {
  try {
    const { userId, calories, protein, carbs, fat, water } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validation
    if (calories && (calories < 800 || calories > 5000)) {
      return new Response(
        JSON.stringify({ error: 'Calories must be between 800 and 5000' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (protein && (protein < 0 || protein > 500)) {
      return new Response(
        JSON.stringify({ error: 'Protein must be between 0 and 500g' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Update in database
    const updatedGoals = {
      calories: calories || 2100,
      protein: protein || 105,
      carbs: carbs || 262,
      fat: fat || 70,
      water: water || 2.5,
      updatedAt: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      goals: updatedGoals,
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