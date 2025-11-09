Model integration instructions (Google Dynamic World U-Net)
---------------------------------------------------------

To run the real Dynamic World U-Net model in this scaffold, follow these steps:

1. Obtain a TensorFlow SavedModel for the Dynamic World U-Net (from Google / Earth Engine or provided checkpoint).
   - Dynamic World artifacts: check Google Earth Engine or Dynamic World documentation for model downloads.

2. Convert the SavedModel to TensorFlow.js format:
   - Install tensorflowjs:
     pip install tensorflowjs
   - Convert:
     tensorflowjs_converter --input_format=tf_saved_model /path/to/saved_model /path/to/eagle-repo/server/models/dynamicworld

   - After conversion, you must have:
     server/models/dynamicworld/model.json
     server/models/dynamicworld/group1-shard1of1.bin (and any additional shard files)

3. Update the inference pipeline:
   - The current `server/inference.js` contains a placeholder pipeline. Replace the placeholder image fetch and preprocess steps with:
     - Download or request Sentinel-2 (or L8/L7) images for the bbox/time range from Earth Engine, Sentinel Hub, or AWS.
     - Stack required bands (e.g., B04, B08, B03) or normalized inputs as the model expects.
     - Resize / normalize to the model's input resolution (e.g., 256x256).
     - Run the model via tfjs-node and map the per-pixel class predictions back to geographic coordinates.

4. Performance:
   - For production, consider batching tiles, caching tiles, and running the model in a GPU environment (tfjs-node-gpu or TF serving).

If you want, provide the model artifact or a download link and I can:
- convert it for tfjs,
- or integrate the correct input preprocessing and postprocessing based on the model signatures.