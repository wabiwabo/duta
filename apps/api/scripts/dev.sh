#!/bin/bash
# Start all infrastructure + API in dev mode
set -e

echo "Starting Docker infrastructure..."
docker compose up -d postgres redis typesense logto prometheus grafana

echo "Waiting for services to be healthy..."
sleep 5

echo "Running Prisma migrations..."
pnpm prisma migrate deploy

echo "Generating Prisma client..."
pnpm prisma generate

echo "Starting API in watch mode..."
pnpm dev
