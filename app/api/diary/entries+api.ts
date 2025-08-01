export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
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

    // Mock diary entries - replace with actual database query
    const mockEntries = [
      {
        id: '1',
        userId,
        foodId: '1',
        foodName: 'Grilled Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        serving: '100g',
        quantity: 1.5,
        meal: 'lunch',
        date,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId,
        foodId: '2',
        foodName: 'Brown Rice',
        calories: 123,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        serving: '100g cooked',
        quantity: 1,
        meal: 'lunch',
        date,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId,
        foodId: '8',
        foodName: 'Banana',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        serving: '1 medium',
        quantity: 1,
        meal: 'breakfast',
        date,
        createdAt: new Date().toISOString(),
      },
    ];

    // Calculate totals by meal
    const mealTotals = mockEntries.reduce((acc, entry) => {
      if (!acc[entry.meal]) {
        acc[entry.meal] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          items: 0,
        };
      }
      
      acc[entry.meal].calories += entry.calories * entry.quantity;
      acc[entry.meal].protein += entry.protein * entry.quantity;
      acc[entry.meal].carbs += entry.carbs * entry.quantity;
      acc[entry.meal].fat += entry.fat * entry.quantity;
      acc[entry.meal].items += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Response.json({
      success: true,
      entries: mockEntries,
      mealTotals,
      date,
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

export async function POST(request: Request) {
  try {
    const { userId, foodId, foodName, calories, protein, carbs, fat, serving, quantity, meal } = await request.json();

    // Validation
    if (!userId || !foodId || !foodName || !meal) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (quantity <= 0) {
      return new Response(
        JSON.stringify({ error: 'Quantity must be greater than 0' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validMeals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    if (!validMeals.includes(meal)) {
      return new Response(
        JSON.stringify({ error: 'Invalid meal type' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Save to database
    const entry = {
      id: Date.now().toString(),
      userId,
      foodId,
      foodName,
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      serving: serving || '',
      quantity: quantity || 1,
      meal,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      entry,
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

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const entryId = url.searchParams.get('entryId');
    const userId = url.searchParams.get('userId'); // TODO: Get from auth token

    if (!entryId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Entry ID and User ID are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Delete from database
    // TODO: Verify user owns the entry

    return Response.json({
      success: true,
      message: 'Entry deleted successfully',
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