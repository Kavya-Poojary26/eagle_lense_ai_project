/**
 * runInferenceForBBox(bbox, analysisMeta)
 *
 * Attempts to load a TFJS model in ./models/dynamicworld/model.json (TFJS format) using 
 * and run segmentation on satellite image@tensorflow/tfjsry for the bbox. Real pipeline must:
 * - fetch Sentinel-2 imagery (true-color or appropriate bands) for the bbox and date ranges
 * - preprocess into model's input size and bands
 * - run model.predict(...) and postprocess to produce a GeoJSON polygon for changed areas
 *
 * For this scaffold, if model is not available or imagery not configured, we return simulated polygons.
 *
 * If you add `server/models/dynamicworld/model.json`, this file will load it (via tfjs-node) and run inference on
 * a placeholder image (or you can replace the image fetching pipeline).
 */

const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs");

// helper to create a simulated polygon (GeoJSON)
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

async function runInferenceForBBox(bbox, analysisMeta = {}) {
  // try to load model
  const modelPath = path.join(__dirname, "models", "dynamicworld", "model.json");
  let modelExists = fs.existsSync(modelPath);
  if (!modelExists) {
    // return simulated result quickly
    return {
      layers: [
        {
          id: "sim-change-1",
          type: "change",
          style: { color: "#ff6b6b", weight: 2, fillOpacity: 0.45 },
          geojson: {
            type: "FeatureCollection",
            features: [createSimulatedGeoJSONPolygon(bbox)]
          }
        },
        {
          id: "sim-change-2",
          type: "change",
          style: { color: "#00d184", weight: 2, fillOpacity: 0.32 },
          geojson: {
            type: "FeatureCollection",
            features: [createSimulatedGeoJSONPolygon([
              bbox[0] + (bbox[2]-bbox[0])*0.1,
              bbox[1] + (bbox[3]-bbox[1])*0.1,
              bbox[2] - (bbox[2]-bbox[0])*0.1,
              bbox[3] - (bbox[3]-bbox[1])*0.1
            ])]
          }
        }
      ]
    };
  }

  // If model is present: load model and run inference.
  // NOTE: You must implement imagery fetching & preprocessing for your pipeline.
  // The code below is an example of how to load the model and a *placeholder* input image.
  try {
    const model = await tf.loadLayersModel(`file://${modelPath}`);
    console.log("Loaded dynamicworld model:", modelPath);

    // Placeholder: create a fake input tensor shaped like [1,height,width,channels]
    // Replace width/height/channels with your model's expected input.
    const height = 256, width = 256, channels = 3;
    const placeholder = tf.randomUniform([1, height, width, channels], 0, 1);

    // run prediction
    const raw = model.predict(placeholder);
    // postprocess - depends on model output
    // This example assumes model returns logits per class per pixel, shape [1,h,w,classes]
    const argmax = raw.argMax(-1).arraySync(); // this is sync for example; in big models do async
    // Build a geojson polygon around "urban" class as a toy example
    const features = [];
    for (let i = 0; i < 2; i++) {
      features.push(createSimulatedGeoJSONPolygon(bbox));
    }

    // cleanup
    tf.dispose([placeholder, raw]);

    return {
      layers: [
        {
          id: "dw-change-1",
          type: "change",
          style: { color: "#ff6b6b", weight: 2, fillOpacity: 0.45 },
          geojson: { type: "FeatureCollection", features }
        }
      ]
    };
  } catch (err) {
    console.error("Model inference failed", err);
    // fallback to simulated polygons
    return {
      layers: [
        {
          id: "sim-fallback",
          type: "change",
          style: { color: "#ff6b6b", weight: 2, fillOpacity: 0.45 },
          geojson: {
            type: "FeatureCollection",
            features: [createSimulatedGeoJSONPolygon(bbox)]
          }
        }
      ]
    };
  }
}

module.exports = { runInferenceForBBox };