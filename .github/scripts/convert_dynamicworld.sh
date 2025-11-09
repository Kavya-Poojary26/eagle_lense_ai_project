#!/usr/bin/env bash
# convert_dynamicworld.sh (robust detector)
# Usage:
#   ./convert_dynamicworld.sh <savedmodel-or-repo-root> <output_dir> [signature_name]
#
# If the first argument points directly to a TF SavedModel (contains saved_model.pb or variables/),
# it will be used. If it points to the dynamicworld repo root, the script will try common subpaths:
#   model/forward, model/backward, models/forward, models/backward, forward, backward
#
# Requirements:
#   pip install tensorflowjs
#
set -euo pipefail

INPUT_PATH="$1"
OUTPUT_DIR="$2"
SIGNATURE_NAME="${3:-serving_default}"

if [ -z "$INPUT_PATH" ] || [ -z "$OUTPUT_DIR" ]; then
  echo "Usage: $0 <savedmodel-or-repo-root> <output_dir> [signature_name]"
  exit 1
fi

# Resolve absolute paths
INPUT_PATH="$(python -c "import os,sys; print(os.path.abspath(sys.argv[1]))" "$INPUT_PATH")"
OUTPUT_DIR="$(python -c "import os,sys; print(os.path.abspath(sys.argv[1]))" "$OUTPUT_DIR")"

echo "Input path: $INPUT_PATH"
echo "Output dir: $OUTPUT_DIR"
echo "Signature: $SIGNATURE_NAME"

# Helper to check if a folder looks like a TF SavedModel
function is_saved_model_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    if [ -f "$dir/saved_model.pb" ] || [ -d "$dir/variables" ]; then
      return 0
    fi
  fi
  return 1
}

# Determine saved model directory
SAVED_MODEL_DIR=""

if is_saved_model_dir "$INPUT_PATH"; then
  SAVED_MODEL_DIR="$INPUT_PATH"
else
  # Candidate subpaths relative to INPUT_PATH
  CANDIDATES=(
    "model/forward"
    "model/backward"
    "models/forward"
    "models/backward"
    "model/forward_saved_model"
    "forward"
    "backward"
    "model"
  )

  for c in "${CANDIDATES[@]}"; do
    candidate="$INPUT_PATH/$c"
    if is_saved_model_dir "$candidate"; then
      SAVED_MODEL_DIR="$candidate"
      echo "Detected SavedModel at: $SAVED_MODEL_DIR"
      break
    fi
  done

  # As last resort, try to find any directory under INPUT_PATH that contains saved_model.pb
  if [ -z "$SAVED_MODEL_DIR" ]; then
    echo "Searching for any saved_model.pb under $INPUT_PATH..."
    found=$(find "$INPUT_PATH" -maxdepth 4 -type f -name 'saved_model.pb' -print -quit || true)
    if [ -n "$found" ]; then
      SAVED_MODEL_DIR="$(dirname "$found")"
      echo "Found saved_model.pb at: $found"
      echo "Using SavedModel dir: $SAVED_MODEL_DIR"
    fi
  fi
fi

if [ -z "$SAVED_MODEL_DIR" ]; then
  echo "Could not locate a TensorFlow SavedModel under '$INPUT_PATH'."
  echo "Please pass the exact SavedModel folder or point to the dynamicworld repo root."
  exit 2
fi

mkdir -p "$OUTPUT_DIR"

echo "Converting SavedModel: $SAVED_MODEL_DIR -> $OUTPUT_DIR"
# Run tensorflowjs_converter. If you encounter op compatibility errors, you may need to adjust flags.
tensorflowjs_converter \
  --input_format=tf_saved_model \
  --signature_name="$SIGNATURE_NAME" \
  --saved_model_tags=serve \
  "$SAVED_MODEL_DIR" "$OUTPUT_DIR"

echo "Conversion complete. Listing output:"
ls -la "$OUTPUT_DIR" || true