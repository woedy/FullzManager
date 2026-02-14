#!/bin/bash

# Import All Data Sets Script
# This script imports all data sets (set1 through set10) into the Django application

echo "🚀 Starting import of all data sets..."
echo "=================================="

# Check if we're running in Docker
if [ -f /.dockerenv ]; then
    echo "Running in Docker container"
    python manage.py import_all_sets --skip-errors
else
    echo "Running outside Docker - using docker-compose"
    docker-compose exec backend python manage.py import_all_sets --skip-errors
fi

echo "=================================="
echo "✅ Import process completed!"