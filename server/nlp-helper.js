/**
 * createOpenAIAnalysis(text, geo)
 *
 * Uses OpenAI (if OPENAI_API_KEY in env) to produce:
 * - a short summary (analysis) suitable to show to the user
 * - extracted timeframe if any
 * - requested target (deforestation, vegetation, urban)
 *
 * Returns: { summary, startDate, endDate, target, location }
 *
 * If OPENAI_API_KEY is missing, returns a simple simulated analysis.
 */

const OpenAI = require("openai");

async function createOpenAIAnalysis(text, geo) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // fallback simulated analysis
    const summary = `Comprehensive Analysis Complete for ${geo.display_name} (${geo.lat.toFixed(
      6
    )}, ${geo.lon.toFixed(6)}).
- Satellite Analysis: Land Use Change: ~5.8% detected
- NDVI Vegetation Analysis: Vegetation Change: +24.1%
- Urban Change: -20.4%
(Simulated analysis. Set OPENAI_API_KEY to enable real NLP summaries.)`;

    return { summary, startDate: null, endDate: null, target: "land-use", location: geo.display_name };
  }

  const client = new OpenAI({ apiKey: key });

  // Step 1: Extract location from the text
  let extractedLocation = geo.display_name; // default fallback
  try {
    const locationPrompt = `
Extract the location (city, town, or region) mentioned in the following user query.
If no location is mentioned, reply with "UNKNOWN".

Query: "${text}"
Location:
`;
    const locationResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: locationPrompt }],
      temperature: 0
    });

    const locText = locationResp.choices?.[0]?.message?.content?.trim() || "";
    if (locText && locText.toUpperCase() !== "UNKNOWN") {
      extractedLocation = locText;
    }
  } catch (err) {
    console.warn("Could not extract location from query, using geo.display_name.", err.message);
  }

  // Step 2: Generate analysis summary
  const prompt = `You are a satellite imagery analyst.
User query: "${text}".
Location: ${extractedLocation} (${geo.lat}, ${geo.lon}).

Produce a concise analysis summary (3-6 bullet points) that includes:
- target detection (deforestation, vegetation change, urban expansion)
- possible timeframe if the user mentioned years
- recommendations for visualizations (NDVI, change polygons)

Provide a JSON object with keys: summary, target, startDate, endDate.
`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    });

    const textResp = resp.choices?.[0]?.message?.content || resp.choices?.[0]?.text || "";
    const jsonStr = textResp.slice(textResp.indexOf("{"));
    const parsed = JSON.parse(jsonStr);

    return {
      summary: parsed.summary || textResp,
      target: parsed.target || "land-use",
      startDate: parsed.startDate || null,
      endDate: parsed.endDate || null,
      location: extractedLocation
    };
  } catch (err) {
    // fallback to using raw text if JSON parsing fails
    console.warn("Failed to parse JSON from OpenAI response. Returning raw text.", err.message);
    return {
      summary: text,
      target: "land-use",
      startDate: null,
      endDate: null,
      location: extractedLocation
    };
  }
}

module.exports = { createOpenAIAnalysis };
