export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mock food database - replace with actual database query
    const mockFoods = [
      {
        id: '1',
        name: 'Grilled Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        serving: '100g',
        brand: null,
        barcode: null,
      },
      {
        id: '2',
        name: 'Brown Rice',
        calories: 123,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        serving: '100g cooked',
        brand: null,
        barcode: null,
      },
      {
        id: '3',
        name: 'Avocado',
        calories: 160,
        protein: 2,
        carbs: 9,
        fat: 15,
        serving: '1 medium',
        brand: null,
        barcode: null,
      },
      {
        id: '4',
        name: 'Greek Yogurt',
        calories: 100,
        protein: 17,
        carbs: 6,
        fat: 0.4,
        serving: '170g',
        brand: 'Generic',
        barcode: null,
      },
      {
        id: '5',
        name: 'Salmon Fillet',
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 12,
        serving: '100g',
        brand: null,
        barcode: null,
      },
      {
        id: '6',
        name: 'Sweet Potato',
        calories: 86,
        protein: 1.6,
        carbs: 20,
        fat: 0.1,
        serving: '1 medium',
        brand: null,
        barcode: null,
      },
      {
        id: '7',
        name: 'Oatmeal',
        calories: 154,
        protein: 5.3,
        carbs: 28,
        fat: 3.2,
        serving: '1 cup cooked',
        brand: null,
        barcode: null,
      },
      {
        id: '8',
        name: 'Banana',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        serving: '1 medium',
        brand: null,
        barcode: null,
      },
      {
        id: '9',
        name: 'Almonds',
        calories: 164,
        protein: 6,
        carbs: 6,
        fat: 14,
        serving: '28g',
        brand: null,
        barcode: null,
      },
      {
        id: '10',
        name: 'Quinoa',
        calories: 222,
        protein: 8,
        carbs: 39,
        fat: 3.6,
        serving: '1 cup cooked',
        brand: null,
        barcode: null,
      },
    ];

    // Filter foods based on search query
    const filteredFoods = mockFoods
      .filter(food => 
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        (food.brand && food.brand.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, limit);

    return Response.json({
      success: true,
      foods: filteredFoods,
      total: filteredFoods.length,
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