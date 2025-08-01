export async function POST(request: Request) {
  try {
    const { userId, amount } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Save to database
    const waterEntry = {
      id: Date.now().toString(),
      userId,
      amount,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      entry: waterEntry,
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId'); // TODO: Get from auth token
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mock water entries - replace with actual database query
    const waterEntries = [
      {
        id: '1',
        userId,
        amount: 0.5,
        date,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        userId,
        amount: 0.3,
        date,
        timestamp: new Date().toISOString(),
      },
    ];

    const totalWater = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);

    return Response.json({
      success: true,
      entries: waterEntries,
      total: totalWater,
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