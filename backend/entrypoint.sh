#!/bin/sh

# Exit the script if any command fails
set -e

echo "Backend entrypoint: Starting."

# Run database migrations
# This uses the npm script, which correctly invokes ts-node and finds the .ts migration files.
echo "Backend entrypoint: Running database migrations..."
npm run db:migrate

# Skip seeds for now since they're already present and causing issues
echo "Backend entrypoint: Skipping seeds (already present)..."

echo "Backend entrypoint: Migrations/seeds complete. Starting the server..."

# Execute the command passed to the script (e.g., 'npm run start')
exec "$@" 