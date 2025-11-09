/**
 * createOpenAIAnalysis(text, geo)
 *
 * Uses OpenAI (if OPENAI_API_KEY in env) to produce:
 * - a short summary (analysis) suitable to show to the user
 * - extracted timeframe if any
 * - requested target (deforestation, vegetation, urban)
 *
 * Returns: { summary, startDate, endDate, target }
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
    return { summary, startDate: null, endDate: null, target: "land-use" };
  }

  const client = new OpenAI({ apiKey: key });
  const prompt = `You are a satellite imagery analyst. User query: "${text}". Location: ${geo.display_name} (${geo.lat}, ${geo.lon}). Produce a concise analysis summary (3-6 bullet points) that includes target detection (deforestation, vegetation change, urban expansion), possible timeframe if the user mentioned years, and a recommendation for visualizations (NDVI, change polygons). Provide a JSON object with keys: summary, target, startDate, endDate.`;

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500
  });

  // OpenAI client libs / API shape may vary — adapt as needed. We'll attempt to parse JSON from the model.
  const textResp = resp.choices?.[0]?.message?.content || resp.choices?.[0]?.text || "";
  // try to extract JSON blob
  try {
    const jsonStr = textResp.slice(textResp.indexOf("{"));
    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary || textResp,
      target: parsed.target || "land-use",
      startDate: parsed.startDate || null,
      endDate: parsed.endDate || null
    };
  } catch (err) {
    // fallback to using the raw text as summary
    return { summary: textResp, target: "land-use", startDate: null, endDate: null };
  }
}

module.exports = { createOpenAIAnalysis };