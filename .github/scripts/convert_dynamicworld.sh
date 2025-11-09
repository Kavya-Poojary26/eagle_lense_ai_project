#!/usr/bin/env bash
set -euo pipefail

# convert_dynamicworld.sh
# Usage: ./convert_dynamicworld.sh /abs/or/relative/path/to/savedmodel /abs/or/relative/output_dir

SAVED_MODEL_DIR="$1"
OUTPUT_DIR="$2"
SIGNATURE_NAME="${3:-serving_default}"

if [ ! -d "$SAVED_MODEL_DIR" ]; then
  echo "SavedModel directory not found: $SAVED_MODEL_DIR"
  exit 2
fi

echo "Converting SavedModel: $SAVED_MODEL_DIR -> $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

tensorflowjs_converter \
  --input_format=tf_saved_model \
  --signature_name="${SIGNATURE_NAME}" \
  --saved_model_tags=serve \
  "$SAVED_MODEL_DIR" "$OUTPUT_DIR"

echo "Conversion complete for $SAVED_MODEL_DIR -> $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
