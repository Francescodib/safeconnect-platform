#!/usr/bin/env bash
# rebuild-frontend.sh
#
# Builds the frontend assets on the host. The running nginx container
# picks up the new files automatically via the volume mount defined in
# docker-compose.override.yml - no Docker image rebuild needed.
#
# Usage:
#   bash rebuild-frontend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building frontend assets..."
cd "$SCRIPT_DIR/frontend" || exit 1
npm run build

echo ""
echo "==> Done. Hard-refresh the browser (Ctrl+Shift+R) to load the new bundle."
