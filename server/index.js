/**
 * EAGLE Lens backend (server/index.js)
 *
 * Endpoints:
 * - GET / -> simple homepage
 * - POST /api/query { text: string }
 * - POST /api/run-inference { bbox, startDate, endDate, target }
 */

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import url from "url";

// --- Try optional modules ---
let runInferenceForBBox;
try {
  const mod = await import("./inference.js");
  runInferenceForBBox = mod.runInferenceForBBox;
} catch (err) {
  console.warn("inference module not available; using fallback:", err.message);
  function createSimulatedGeoJSONPolygon(bbox) {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const midLon = (minLon + maxLon) / 2;
    const midLat = (minLat + maxLat) / 2;
    const smallLonSpan = (maxLon - minLon) * 0.3;
    const smallLatSpan = (maxLat - minLat) * 0.25;
    const coords = [
      [midLon - smallLonSpan, midLat - smallLatSpan],
      [midLon + smallLonSpan, midLat - smallLatSpan],
      [midLon + smallLonSpan, midLat + smallLatSpan],
      [midLon - smallLonSpan, midLat + smallLatSpan],
      [midLon - smallLonSpan, midLat - smallLatSpan]
    ];
    return {
      type: "Feature",
      properties: { change: "simulated", intensity: Math.round(Math.random() * 100) },
      geometry: { type: "Polygon", coordinates: [coords] }
    };
  }
  runInferenceForBBox = async (bbox) => ({
    layers: [
      {
        id: "sim-fallback",
        type: "change",
        style: { color: "#ff6b6b", weight: 2, fillOpacity: 0.45 },
        geojson: { type: "FeatureCollection", features: [createSimulatedGeoJSONPolygon(bbox)] }
      }
    ]
  });
}

let geocodeText;
try {
  const mod = await import("./geocode.js");
  geocodeText = mod.geocodeText;
} catch (err) {
  console.warn("geocode module not available; using fallback.", err.message);
  geocodeText = async (text) => ({
    lat: 0,
    lon: 0,
    bbox: [-0.01, -0.01, 0.01, 0.01],
    display_name: `fallback location for "${text}"`
  });
}

let createOpenAIAnalysis;
try {
  const mod = await import("./nlp-helper.js");
  createOpenAIAnalysis = mod.createOpenAIAnalysis;
} catch (err) {
  console.warn("nlp-helper not available; using fallback analysis.", err.message);
  createOpenAIAnalysis = async (text, geo) => ({
    summary: `Fallback analysis for "${text}" at ${geo.display_name}`,
    target: "land-use",
    startDate: null,
    endDate: null,
    location: geo.display_name
  });
}

const PORT = process.env.PORT || 3333;

// --- Helper ---
function extractLocation(queryText) {
  const match = queryText.match(/(?:in|at)\s+([A-Za-z\s,]+)/i);
  if (match && match[1]) return match[1].trim();
  return queryText;
}

// --- Main Express app ---
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ✅ Homepage
app.get("/", (req, res) => {
  res.send("EAGLE Lens Server Running! Use /api/query or /api/run-inference.");
});

// POST /api/query
app.post("/api/query", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  try {
    const locationQuery = extractLocation(text);
    const geo = await geocodeText(locationQuery);
    const analysis = await createOpenAIAnalysis(text, geo);
    const inference = await runInferenceForBBox(geo.bbox, analysis);

    res.json({
      message: "Query processed",
      analysisText: analysis.summary,
      bbox: geo.bbox,
      place: geo.display_name,
      geojsonLayers: inference.layers
    });
  } catch (err) {
    console.error("Error /api/query", err);
    res.status(500).json({ error: err.message || "internal error" });
  }
});

// POST /api/run-inference
app.post("/api/run-inference", async (req, res) => {
  const { bbox, startDate, endDate, target } = req.body;
  try {
    const inference = await runInferenceForBBox(bbox, { startDate, endDate, target });
    res.json({ layers: inference.layers });
  } catch (err) {
    console.error("Error /api/run-inference", err);
    res.status(500).json({ error: err.message || "inference failed" });
  }
});

app.listen(PORT, () => console.log(`✅ EAGLE Lens server running on http://localhost:${PORT}`));
