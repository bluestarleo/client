import { NextRequest, NextResponse } from 'next/server';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');

    if (!latStr || !lonStr) {
      return NextResponse.json({ error: 'Parameters "lat" and "lon" are required.' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates provided.' }, { status: 400 });
    }

    // Overpass QL query to find historic, tourism, parks, and dining amenities within 3000m (approx 40min walk)
    const overpassQuery = `
      [out:json][timeout:15];
      (
        node(around:3000, ${lat}, ${lon})["tourism"];
        node(around:3000, ${lat}, ${lon})["historic"];
        node(around:3000, ${lat}, ${lon})["leisure"="park"];
        node(around:3000, ${lat}, ${lon})["amenity"~"restaurant|cafe|bar|pub"];
      );
      out body;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery.trim())}`;
    
    console.log(`[POIs API] Querying Overpass API for: (${lat}, ${lon})`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AITravelCompanion/1.0 (contact: leo.zhu@example.com)'
      }
    });

    if (!response.ok) {
      console.error(`[POIs API] Overpass responded with status: ${response.status}`);
      return NextResponse.json({ error: 'Point of interest service is temporarily unavailable.' }, { status: 502 });
    }

    const result = await response.json();
    const elements = result.elements || [];

    // Map and filter OSM elements to structured points of interest
    const pois = elements
      .filter((el: any) => el.lat && el.lon && el.tags && el.tags.name)
      .map((el: any) => {
        const poiLat = el.lat;
        const poiLon = el.lon;
        const distance = getDistance(lat, lon, poiLat, poiLon);
        
        // Categories formatting
        let category = 'Point of Interest';
        if (el.tags.tourism) category = el.tags.tourism;
        else if (el.tags.historic) category = el.tags.historic;
        else if (el.tags.amenity) category = el.tags.amenity;
        else if (el.tags.leisure) category = el.tags.leisure;

        category = category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');

        return {
          id: el.id,
          name: el.tags.name,
          category,
          lat: poiLat,
          lon: poiLon,
          distance: Math.round(distance), // in meters
          walkingTime: Math.max(1, Math.round(distance / 80)) // assuming average walking speed of 80m/min (~4.8 km/h)
        };
      })
      // Sort by closest distance first
      .sort((a: any, b: any) => a.distance - b.distance)
      // Limit to 10 points of interest
      .slice(0, 10);

    return NextResponse.json({ pois });
  } catch (error: any) {
    console.error('[POIs API Error]:', error);
    return NextResponse.json({ error: error.message || 'Server error fetching nearby points of interest.' }, { status: 500 });
  }
}
