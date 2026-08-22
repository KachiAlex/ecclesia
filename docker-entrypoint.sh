#!/bin/sh

set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js application..."
exec npx next start -H 0.0.0.0 -p 3000
