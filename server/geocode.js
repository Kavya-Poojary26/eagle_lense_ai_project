/**
 * geocodeText(text): tries to find coordinates for a user's query.
 * - By default uses Nominatim (OpenStreetMap). Optionally can be replaced with Google geocoding if env config is provided.
 *
 * Returns: { lat, lon, bbox: [minLon,minLat,maxLon,maxLat], display_name }
 */

const fetch = require("node-fetch");

async function geocodeText(text) {
  const service = process.env.GEOCODING_SERVICE || "nominatim";
  if (service === "google" && process.env.GOOGLE_GEOCODING_KEY) {
    // Google geocoding (if you want) - not implemented fully here
    const key = process.env.GOOGLE_GEOCODING_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}&key=${key}`;
    const r = await fetch(url);
    const j = await r.json();
    if (j.status === "OK" && j.results && j.results.length) {
      const res0 = j.results[0];
      const lat = res0.geometry.location.lat;
      const lon = res0.geometry.location.lng;
      const bbox = [lon - 0.01, lat - 0.01, lon + 0.01, lat + 0.01];
      return { lat, lon, bbox, display_name: res0.formatted_address };
    }
    throw new Error("Google geocoding returned no results");
  }

  // Default: Nominatim
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1&polygon_geojson=1`;
  const r = await fetch(url, { headers: { "User-Agent": "EAGLE-Lens-1.0" } });
  const data = await r.json();
  if (!data || !data.length) throw new Error("Location not found");
  const p = data[0];
  const lat = parseFloat(p.lat);
  const lon = parseFloat(p.lon);

  // bbox from OSM: [minlon, minlat, maxlon, maxlat]
  let bbox;
  if (p.boundingbox && p.boundingbox.length === 4) {
    const [minlat, maxlat, minlon, maxlon] = p.boundingbox;
    bbox = [parseFloat(minlon), parseFloat(minlat), parseFloat(maxlon), parseFloat(maxlat)];
  } else {
    bbox = [lon - 0.01, lat - 0.01, lon + 0.01, lat + 0.01];
  }

  return { lat, lon, bbox, display_name: p.display_name };
}

module.exports = { geocodeText };