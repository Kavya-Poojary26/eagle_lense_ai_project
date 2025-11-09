```js
/**
 * verify_tfjs_model.js
 *
 * Simple verification utility that attempts to load a converted TFJS model
 * using @tensorflow/tfjs-node and run a dummy predict to validate basic I/O.
 *
 * Usage:
 *   node verify_tfjs_model.js /path/to/model.json
 *
 * If the model requires a specific input shape or dtype, adjust `inputShape` below.
 */
const tf = require('@tensorflow/tfjs-node');
const path = require('path');

async function verify(modelJsonPath) {
  console.log('Verifying model:', modelJsonPath);
  let model = null;
  try {
    model = await tf.loadGraphModel('file://' + path.resolve(modelJsonPath));
    console.log('Loaded model as GraphModel');
  } catch (e) {
    console.warn('GraphModel load failed, trying LayersModel...', e.message || e);
    try {
      model = await tf.loadLayersModel('file://' + path.resolve(modelJsonPath));
      console.log('Loaded model as LayersModel');
    } catch (e2) {
      console.error('Failed to load model:', e2.message || e2);
      process.exit(1);
    }
  }

  // Customize these to match the model expected input
  const inputShape = [1, 256, 256, 3];
  const x = tf.randomUniform(inputShape, 0, 1, 'float32');

  try {
    const y = model.predict ? model.predict(x) : await model.executeAsync(x);
    if (Array.isArray(y)) {
      y.forEach((t, i) => console.log(`Output[${i}] shape:`, t.shape));
    } else {
      console.log('Output shape:', y.shape);
    }
    tf.dispose(y);
  } catch (err) {
    console.error('Model execution failed. You may need to adapt input shape/dtype or use a GraphModel signature.', err);
    process.exit(1);
  } finally {
    tf.dispose(x);
  }
  console.log('Verification finished successfully (if output shapes printed).');
}

if (process.argv.length < 3) {
  console.error('Usage: node verify_tfjs_model.js /path/to/model.json');
  process.exit(1);
}

verify(process.argv[2]).catch((e) => {
  console.error('Verification error:', e);
  process.exit(1);
});