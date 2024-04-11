#!/usr/bin/env bash

set -e

# switch to script directory
cd "$(dirname "${BASH_SOURCE[0]}")"

# run all generator scripts
source generate_core_openapi.bash
source generate_ws_api_docs.bash
