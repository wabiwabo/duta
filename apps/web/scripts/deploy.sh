#!/bin/bash
# Deploy script for duta-web
# Usage: ./scripts/deploy.sh
set -euo pipefail

echo "=== Deploying duta-web ==="

cd /opt/duta-web

echo "1. Installing dependencies..."
pnpm install --frozen-lockfile

echo "2. Generating API client from OpenAPI spec..."
pnpm api:generate

echo "3. Building Next.js..."
pnpm build

echo "4. Restarting via PM2..."
pm2 delete duta-web 2>/dev/null || true
sleep 2
pm2 start "pnpm start" --name duta-web --cwd /opt/duta-web
pm2 save

echo "5. Verifying..."
sleep 5
if curl -sf http://localhost:3000 > /dev/null; then
  echo "=== duta-web deployed successfully ==="
else
  echo "=== WARNING: Health check failed ==="
  pm2 logs duta-web --lines 10 --nostream
  exit 1
fi
