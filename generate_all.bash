#!/usr/bin/env bash

set -e

# switch to root of repo
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# run all generator scripts
source scripts/generate_core_openapi.bash
source scripts/generate_ws_api_docs.bash

# verify that routes are visible
# N.B. intentionally NOT autogenerating the markdown from the OpenAPI
# as we may want to add extra text to those files in the future
python scripts/verify_routes_visible.py
