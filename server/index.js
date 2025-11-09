/**
 * EAGLE Lens backend (server/index.js)
 *
 * Endpoints:
 * - POST /api/query { text: string } -> parses user query, geocodes, runs inference, returns analysis + bbox + geojsonLayers
 * - POST /api/run-inference { bbox, startDate, endDate, target } -> runs inference via TF model if available, otherwise returns simulated geojson
 *
 * Model path expected: server/models/dynamicworld/model.json (TFJS format) - optional
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { runInferenceForBBox } = require("./inference");
const { geocodeText } = require("./geocode");
const { createOpenAIAnalysis } = require("./nlp-helper");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3333;

app.post("/api/query", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  try {
    // 1. Geocode: try to find a place/bbox for text
    const geo = await geocodeText(text);
    // geo example: { lat, lon, bbox: [minLon,minLat,maxLon,maxLat], display_name }

    // 2. Optional: use OpenAI to parse timeframe/targets and produce a summary.
    const analysis = await createOpenAIAnalysis(text, geo);

    // 3. Run inference for the bbox (attempt to load TFJS model; fallback to simulated)
    const inference = await runInferenceForBBox(geo.bbox, analysis);

    // return
    res.json({
      message: "Query processed",
      analysisText: analysis.summary,
      bbox: geo.bbox,
      place: geo.display_name,
      geojsonLayers: inference.layers // array of { id, type, geojson, style }
    });
  } catch (err) {
    console.error("Error /api/query", err);
    res.status(500).json({ error: err.message || "internal error" });
  }
});

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

app.listen(PORT, () => {
  console.log(`EAGLE Lens server running on http://localhost:${PORT}`);
});