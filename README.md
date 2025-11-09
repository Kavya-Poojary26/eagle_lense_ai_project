# EAGLE Lens — Satellite Change Detection & Chatbot (scaffold)

This repository is a full-stack scaffold for "EAGLE Lens" (UI inspired by the screenshots you provided). It includes:
- React + Vite frontend with Leaflet map and chat window.
- Node/Express backend with endpoints for geocoding, NLP query parsing, and model inference.
- Integration points to plug in the Google Dynamic World pre-trained U-Net (TF) model (instructions below).
- Simulated fallback data so the app runs out-of-the-box.

Important:
- To run real land-cover inference you must download/convert the Google Dynamic World U-Net model to TFJS format and place it in `/server/models/dynamicworld` as `model.json` + weight files OR configure the backend to load your model path.
- For improved NLP/chat answers, set an OpenAI API key in `.env`.

Quick start (dev)
1. Clone repo
2. Install dependencies:
   - At repo root:
     npm install
3. Run dev servers (frontend + backend):
   npm run dev
4. Open http://localhost:5173

Environment variables
- Create a `.env` at project root (server will read these):
  - OPENAI_API_KEY (optional) — if present, backend will use OpenAI for analysis + summarization.
  - GEOCODING_SERVICE (optional) — 'nominatim' (default) or 'google'
  - GOOGLE_GEOCODING_KEY (optional) — required if GEOCODING_SERVICE=google

Model integration (Google Dynamic World U-Net)
1. Obtain the Dynamic World model checkpoint or TF SavedModel from Google (Earth Engine / Google resources).
   - If Google provides a TF SavedModel, convert to TensorFlow.js format:
     pip install tensorflowjs
     tensorflowjs_converter --input_format=tf_saved_model /path/to/saved_model /path/to/server/models/dynamicworld
   - The converted TFJS artifacts must include `model.json` and shard weight files inside `server/models/dynamicworld/`.
2. On the server, the inference module in `/server/inference.js` will try to load `./models/dynamicworld/model.json` using `@tensorflow/tfjs-node`. If absent, the endpoint returns simulated data.

How the chatbot flow works (high-level)
- Frontend Chat component sends `POST /api/query { text }`.
- Backend:
  - Geocodes location from query (Nominatim by default).
  - Optionally uses OpenAI to parse the query for timeframe and targets (deforestation/vegetation/urban).
  - Calls the inference pipeline (`/api/run-inference`) to produce change GeoJSON for the bbox (attempts real model inference if available).
  - Returns analysis text + GeoJSON layers + bbox to frontend.
- Frontend maps the bbox -> auto-zoom and overlays polygons/heatmaps and timeline charts.

Notes & limitations
- Fetching and pre-processing satellite images (Sentinel-2 L1/L2) for model input is environment-specific and may require Earth Engine, Sentinelhub, or AWS S3 access. The scaffold includes a placeholder inference pipeline and detailed instructions to plug your imagery source.
- This scaffold uses Nominatim open geocoding by default. If you want to use Google's geocoding or another provider, configure `GEOCODING_SERVICE` and keys.

Files included
- frontend React app: `src/*`
- backend: `server/*`
- package.json scripts to run both parts concurrently

If you want I can:
- Convert an actual Dynamic World SavedModel to TFJS for you if you provide the model artifact or a link.
- Wire up Earth Engine or Sentinel Hub image fetching (requires credentials).

Enjoy — let's run the app and then swap the real model in.