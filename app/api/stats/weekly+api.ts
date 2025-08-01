export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId'); // TODO: Get from auth token
    const startDate = url.searchParams.get('startDate');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mock weekly stats - replace with actual database query
    const weeklyStats = [
      { day: 'Mon', calories: 1850, goal: 2100, protein: 95, carbs: 180, fat: 65 },
      { day: 'Tue', calories: 2200, goal: 2100, protein: 110, carbs: 220, fat: 75 },
      { day: 'Wed', calories: 1950, goal: 2100, protein: 98, carbs: 195, fat: 68 },
      { day: 'Thu', calories: 2050, goal: 2100, protein: 105, carbs: 205, fat: 70 },
      { day: 'Fri', calories: 1800, goal: 2100, protein: 88, carbs: 170, fat: 62 },
      { day: 'Sat', calories: 2300, goal: 2100, protein: 115, carbs: 240, fat: 80 },
      { day: 'Sun', calories: 1900, goal: 2100, protein: 92, carbs: 185, fat: 66 },
    ];

    const summary = {
      avgCalories: Math.round(weeklyStats.reduce((sum, day) => sum + day.calories, 0) / weeklyStats.length),
      avgProtein: Math.round(weeklyStats.reduce((sum, day) => sum + day.protein, 0) / weeklyStats.length),
      avgCarbs: Math.round(weeklyStats.reduce((sum, day) => sum + day.carbs, 0) / weeklyStats.length),
      avgFat: Math.round(weeklyStats.reduce((sum, day) => sum + day.fat, 0) / weeklyStats.length),
      daysOnTarget: weeklyStats.filter(day => day.calories >= day.goal * 0.9 && day.calories <= day.goal * 1.1).length,
    };

    return Response.json({
      success: true,
      weeklyStats,
      summary,
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