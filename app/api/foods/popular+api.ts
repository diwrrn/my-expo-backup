export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Mock popular foods - replace with actual database query
    const popularFoods = [
      {
        id: '1',
        name: 'Grilled Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        serving: '100g',
        popularity: 95,
      },
      {
        id: '2',
        name: 'Brown Rice',
        calories: 123,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        serving: '100g cooked',
        popularity: 88,
      },
      {
        id: '3',
        name: 'Avocado',
        calories: 160,
        protein: 2,
        carbs: 9,
        fat: 15,
        serving: '1 medium',
        popularity: 92,
      },
      {
        id: '4',
        name: 'Greek Yogurt',
        calories: 100,
        protein: 17,
        carbs: 6,
        fat: 0.4,
        serving: '170g',
        popularity: 85,
      },
      {
        id: '5',
        name: 'Salmon Fillet',
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 12,
        serving: '100g',
        popularity: 78,
      },
      {
        id: '6',
        name: 'Sweet Potato',
        calories: 86,
        protein: 1.6,
        carbs: 20,
        fat: 0.1,
        serving: '1 medium',
        popularity: 82,
      },
    ];

    const limitedFoods = popularFoods
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);

    return Response.json({
      success: true,
      foods: limitedFoods,
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