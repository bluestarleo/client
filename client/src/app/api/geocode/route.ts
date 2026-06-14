import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim() === '') {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
    }

    const queryStr = q.trim();

    // Call OpenStreetMap Nominatim API
    // Nominatim requires a descriptive User-Agent as per their usage policy
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=1`;

    console.log(`[Geocoding] Fetching coordinates for: "${queryStr}"`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AITravelCompanion/1.0 (contact: leo.zhu@example.com)'
      }
    });

    if (!response.ok) {
      console.error(`[Geocoding] Nominatim request failed with status: ${response.status}`);
      return NextResponse.json({ error: 'Geocoding service unavailable.' }, { status: 502 });
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: `Address "${queryStr}" could not be found.` }, { status: 404 });
    }

    const result = data[0];
    return NextResponse.json({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name
    });
  } catch (error: any) {
    console.error('[Geocode API Error]:', error);
    return NextResponse.json({ error: error.message || 'Server error during geocoding.' }, { status: 500 });
  }
}
