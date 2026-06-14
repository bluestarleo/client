import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim() === '') {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
    }

    const queryStr = q.trim();

    // Try Nominatim API first, but fallback to Photon if it fails/403s
    try {
      console.log(`[Geocoding] Trying Nominatim API for: "${queryStr}"`);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=1`;
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'AITravelCompanion/1.0 (contact: leo.zhu@example.com)'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const result = data[0];
          console.log(`[Geocoding] Nominatim succeeded for: "${queryStr}"`);
          return NextResponse.json({
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            displayName: result.display_name
          });
        }
      } else {
        console.warn(`[Geocoding] Nominatim request failed with status: ${response.status}. Falling back to Photon...`);
      }
    } catch (err) {
      console.error('[Geocoding] Nominatim request error:', err);
    }

    // Fallback: Photon API by Komoot
    console.log(`[Geocoding] Querying Photon API for: "${queryStr}"`);
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryStr)}&limit=1`;
    const response = await fetch(photonUrl);

    if (!response.ok) {
      console.error(`[Geocoding] Photon request failed with status: ${response.status}`);
      return NextResponse.json({ error: 'Geocoding service unavailable.' }, { status: 502 });
    }

    const data = await response.json();

    if (!data || !data.features || data.features.length === 0) {
      return NextResponse.json({ error: `Address "${queryStr}" could not be found.` }, { status: 404 });
    }

    const feature = data.features[0];
    const coordinates = feature.geometry.coordinates; // [lon, lat]
    const props = feature.properties || {};

    // Build standard displayName from properties
    const name = props.name || '';
    const street = [props.housenumber, props.street].filter(Boolean).join(' ');
    const city = props.city || props.locality || '';
    const state = props.state || '';
    const postcode = props.postcode || '';
    const country = props.country || '';

    const displayName = [name, street, city, state, postcode, country]
      .filter(part => part && part.trim() !== '')
      .filter((item, index, self) => self.indexOf(item) === index) // deduplicate
      .join(', ');

    console.log(`[Geocoding] Photon succeeded for: "${queryStr}" -> [${coordinates[1]}, ${coordinates[0]}]`);

    return NextResponse.json({
      lat: coordinates[1],
      lon: coordinates[0],
      displayName: displayName || queryStr
    });

  } catch (error: any) {
    console.error('[Geocode API Error]:', error);
    return NextResponse.json({ error: error.message || 'Server error during geocoding.' }, { status: 500 });
  }
}

