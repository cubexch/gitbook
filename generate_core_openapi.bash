#!/usr/bin/env bash
#
# Copies markdown files from core and downconverts them to OpenAPI 3.0
#
# Expects:
#   "core" checked out in same directory as this repo
#   pnpm installed

set -e

# switch to script directory
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
cd "$SCRIPT_DIR"

# all relative to script directory
CORE_OPENAPI_DIR="../core/build-http-api"
OUT_DIR="./generated/core"

if [ ! -d "$CORE_OPENAPI_DIR" ]; then
  echo "Can't find directory for schemas at $CORE_OPENAPI_DIR"
  exit 1
fi

echo "Building docs to make sure we deploy latest version..."
cd "$CORE_OPENAPI_DIR"
cargo c
cd -


echo 'Removing any extant core docs...'
pwd
# smack with hammer...
mkdir -p "$OUT_DIR"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "Downconverting docs to $OUT_DIR..."
# YAGNI: package.json this if we add too many more of these to reduce generation time
pnpm dlx @apiture/openapi-down-convert --input "$CORE_OPENAPI_DIR/iridium.openapi.json" --output "$OUT_DIR/ir_api_30.json"
pnpm dlx @apiture/openapi-down-convert --input "$CORE_OPENAPI_DIR/osmium.openapi.json" --output "$OUT_DIR/os_api_30.json"
pnpm dlx @apiture/openapi-down-convert --input "$CORE_OPENAPI_DIR/mendelev.openapi.json" --output "$OUT_DIR/md_api_30.json"

echo 'Success!'
