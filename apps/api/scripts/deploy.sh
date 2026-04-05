#!/bin/bash
# Deploy script for duta-api
# Usage: ./scripts/deploy.sh
set -euo pipefail

echo "=== Deploying duta-api ==="

cd /opt/duta-api

echo "1. Installing dependencies..."
pnpm install --frozen-lockfile

echo "2. Running database migrations..."
pnpm prisma migrate deploy

echo "3. Generating Prisma client..."
pnpm prisma generate

echo "4. Building..."
pnpm build

echo "5. Generating OpenAPI spec..."
pnpm openapi:generate

echo "6. Restarting API via PM2..."
pm2 delete duta-api 2>/dev/null || true
sleep 2
pm2 start dist/src/main.js --name duta-api --cwd /opt/duta-api --kill-timeout 5000
pm2 save

echo "7. Verifying..."
sleep 3
if curl -sf http://localhost:3001/api/health > /dev/null; then
  echo "=== duta-api deployed successfully ==="
else
  echo "=== WARNING: Health check failed ==="
  pm2 logs duta-api --lines 10 --nostream
  exit 1
fi
