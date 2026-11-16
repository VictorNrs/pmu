#!/bin/sh
# Applies pending database migrations, then starts the application.
set -e
cd /app/apps/api
echo "Applying database migrations..."
npx prisma migrate deploy
echo "Starting application on port ${API_PORT}..."
exec npx tsx src/main.ts
